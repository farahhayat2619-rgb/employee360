"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { ALL_STAFF, annType } from "@/lib/comms";
import { db } from "@/lib/db";
import { localDate } from "@/lib/time";
import type { ActionResult, AnnouncementTypeLabel } from "@/lib/types";

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");
const firstError = (e: z.ZodError) => ({ ok: false, message: e.issues[0].message }) as const;
const refreshShell = () => revalidatePath("/", "layout"); // the bell count lives in every portal layout

/* ---------------- Complaint tickets ---------------- */

const TicketSchema = z.object({
  subject: z.string().trim().min(5, "Give the complaint a short subject (at least 5 characters).").max(120, "Keep the subject under 120 characters."),
  description: z.string().trim().min(10, "Describe the problem in a little more detail (at least 10 characters).").max(2000, "Keep the description under 2,000 characters."),
});

/** Next ID for the year, e.g. TKT-2026-00048. */
async function nextTicketId() {
  const year = localDate(new Date()).slice(0, 4);
  const last = await db.ticket.findFirst({ where: { id: { startsWith: `TKT-${year}-` } }, orderBy: { id: "desc" }, select: { id: true } });
  const n = last ? Number(last.id.slice(-5)) + 1 : 1;
  return `TKT-${year}-${String(n).padStart(5, "0")}`;
}

export async function submitTicket(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize();
  const parsed = TicketSchema.safeParse({ subject: clean(form.get("subject")), description: clean(form.get("description")) });
  if (!parsed.success) return firstError(parsed.error);

  // Two people submitting at the same moment could pick the same number; retry with the next one.
  let id = "";
  for (let attempt = 0; attempt < 3 && !id; attempt++) {
    const candidate = await nextTicketId();
    try {
      await db.ticket.create({
        data: {
          id: candidate,
          ...parsed.data,
          submittedById: me.employeeId,
          department: me.department,
          latestUpdate: "Waiting for management review",
          updates: { create: { byId: me.employeeId, action: "Submitted", note: "Ticket created" } },
        },
      });
      id = candidate;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!id) return { ok: false, message: "Couldn't create the ticket just now. Please try again." };

  const reviewers = await db.employee.findMany({ where: { status: { not: "INACTIVE" }, user: { role: "MANAGEMENT", active: true }, id: { not: me.employeeId } }, select: { id: true } });
  await db.notification.createMany({ data: reviewers.map((r) => ({ employeeId: r.id, type: "ticket", message: `New complaint ${id} from ${me.name} (${me.department}): ${parsed.data.subject}`, link: "/management/tickets" })) });
  await audit(me.email, "ticket.submit", "Ticket", id, undefined, parsed.data);
  revalidatePath("/employee/tickets");
  revalidatePath("/management/tickets");
  refreshShell();
  return { ok: true, message: `Ticket ${id} submitted. Management will review it.` };
}

const ForwardSchema = z.object({
  id: z.string().min(1),
  department: z.string().trim().min(1, "Choose the department that should handle this."),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional(),
});

/** Management reviews an open complaint and sends it to the department that can fix it. */
export async function forwardTicket(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("management", "admin");
  const parsed = ForwardSchema.safeParse({ id: clean(form.get("id")), department: clean(form.get("department")), note: clean(form.get("note")) || undefined });
  if (!parsed.success) return firstError(parsed.error);
  const { id, department, note } = parsed.data;

  const t = await db.ticket.findUnique({ where: { id }, select: { status: true, submittedById: true, subject: true } });
  if (!t) return { ok: false, message: "That ticket no longer exists." };
  if (t.submittedById === me.employeeId) return { ok: false, message: "You can't review your own complaint. Another manager will handle it." };
  if (t.status !== "OPEN") return { ok: false, message: `${id} has already been forwarded.` };
  const dept = await db.department.findUnique({ where: { name: department }, select: { id: true } });
  if (!dept) return { ok: false, message: "That department doesn't exist." };

  // Only move it if it is still open, so two managers can't forward the same ticket twice.
  const moved = await db.ticket.updateMany({ where: { id, status: "OPEN" }, data: { status: "PENDING", forwardedTo: department, latestUpdate: `Forwarded to ${department}` } });
  if (moved.count === 0) return { ok: false, message: `${id} has already been forwarded.` };
  await db.ticketUpdate.create({ data: { ticketId: id, byId: me.employeeId, action: "Forwarded", note: `Forwarded to ${department}${note ? `: ${note}` : ""}` } });

  const team = await db.employee.findMany({ where: { departmentId: dept.id, status: { not: "INACTIVE" }, id: { notIn: [me.employeeId, t.submittedById] } }, select: { id: true } });
  await db.notification.createMany({
    data: [
      { employeeId: t.submittedById, type: "ticket", message: `${id} was forwarded to ${department}.`, link: "/employee/tickets" },
      ...team.map((p) => ({ employeeId: p.id, type: "ticket", message: `New ticket for ${department}: ${id} ${t.subject}`, link: "/employee/department-inbox" })),
    ],
  });
  await audit(me.email, "ticket.forward", "Ticket", id, { status: "OPEN" }, { status: "PENDING", forwardedTo: department });
  revalidatePath("/management/tickets");
  refreshShell();
  return { ok: true, message: `${id} forwarded to ${department}.` };
}

const WorkSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(["update", "close"]),
  note: z.string().trim().min(5, "Write at least a short sentence (5 characters or more).").max(1000, "Keep it under 1,000 characters."),
});

/** The department the ticket was forwarded to posts progress, then closes it with a resolution. */
export async function workTicket(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize();
  const parsed = WorkSchema.safeParse({ id: clean(form.get("id")), mode: clean(form.get("mode")), note: clean(form.get("note")) });
  if (!parsed.success) return firstError(parsed.error);
  const { id, mode, note } = parsed.data;

  const t = await db.ticket.findUnique({ where: { id }, select: { status: true, forwardedTo: true, submittedById: true } });
  if (!t || t.forwardedTo !== me.department) return { ok: false, message: "That ticket isn't in your department's inbox." };
  if (t.submittedById === me.employeeId) return { ok: false, message: "You raised this complaint, so a colleague needs to handle it." };
  if (t.status !== "PENDING") return { ok: false, message: `${id} is already closed.` };

  if (mode === "close") {
    const closed = await db.ticket.updateMany({ where: { id, status: "PENDING" }, data: { status: "CLOSED", latestUpdate: "Resolved", resolution: note } });
    if (closed.count === 0) return { ok: false, message: `${id} is already closed.` };
  } else {
    await db.ticket.update({ where: { id }, data: { latestUpdate: note } });
  }
  await db.ticketUpdate.create({ data: { ticketId: id, byId: me.employeeId, action: mode === "close" ? "Closed" : "Updated", note: mode === "close" ? `Resolved: ${note}` : note } });
  await db.notification.create({
    data: { employeeId: t.submittedById, type: "ticket", message: mode === "close" ? `${id} was resolved by ${me.department}: ${note}` : `Update on ${id} from ${me.department}: ${note}`, link: "/employee/tickets" },
  });
  await audit(me.email, `ticket.${mode}`, "Ticket", id, undefined, { note });
  revalidatePath("/employee/department-inbox");
  refreshShell();
  return { ok: true, message: mode === "close" ? `${id} closed. The person who raised it has been told.` : `${id} updated. The person who raised it has been told.` };
}

/* ---------------- HR helpdesk ---------------- */

const HelpdeskSchema = z.object({
  subject: z.string().trim().min(4, "Give your request a short subject (at least 4 characters).").max(120, "Keep the subject under 120 characters."),
  message: z.string().trim().min(10, "Tell HR a little more (at least 10 characters).").max(2000, "Keep the message under 2,000 characters."),
});

export async function submitHelpdesk(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize();
  const parsed = HelpdeskSchema.safeParse({ subject: clean(form.get("subject")), message: clean(form.get("message")) });
  if (!parsed.success) return firstError(parsed.error);

  let id = "";
  for (let attempt = 0; attempt < 3 && !id; attempt++) {
    const last = await db.helpdeskRequest.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const candidate = `HR-${String((last ? Number(last.id.slice(3)) : 0) + 1).padStart(4, "0")}`;
    try {
      await db.helpdeskRequest.create({ data: { id: candidate, employeeId: me.employeeId, ...parsed.data } });
      id = candidate;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!id) return { ok: false, message: "Couldn't send the request just now. Please try again." };

  const hr = await db.employee.findMany({ where: { status: { not: "INACTIVE" }, user: { role: "ADMIN", active: true }, id: { not: me.employeeId } }, select: { id: true } });
  await db.notification.createMany({ data: hr.map((h) => ({ employeeId: h.id, type: "helpdesk", message: `Helpdesk ${id} from ${me.name}: ${parsed.data.subject}`, link: "/admin/helpdesk" })) });
  await audit(me.email, "helpdesk.submit", "HelpdeskRequest", id, undefined, parsed.data);
  revalidatePath("/employee/helpdesk");
  revalidatePath("/admin/helpdesk");
  refreshShell();
  return { ok: true, message: `Request ${id} sent to HR.` };
}

const ReplySchema = z.object({
  id: z.string().min(1),
  reply: z.string().trim().min(5, "Write a reply (at least 5 characters).").max(2000, "Keep the reply under 2,000 characters."),
  resolve: z.boolean(),
});

export async function replyHelpdesk(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const parsed = ReplySchema.safeParse({ id: clean(form.get("id")), reply: clean(form.get("reply")), resolve: form.get("resolve") === "on" });
  if (!parsed.success) return firstError(parsed.error);
  const { id, reply, resolve } = parsed.data;

  const before = await db.helpdeskRequest.findUnique({ where: { id }, select: { employeeId: true, status: true, reply: true, subject: true } });
  if (!before) return { ok: false, message: "That request no longer exists." };
  if (before.employeeId === me.employeeId) return { ok: false, message: "This is your own request, so another HR colleague needs to answer it." };

  const status = resolve ? "RESOLVED" : "IN_PROGRESS";
  await db.helpdeskRequest.update({ where: { id }, data: { reply, status, repliedBy: me.name } });
  await db.notification.create({ data: { employeeId: before.employeeId, type: "helpdesk", message: `HR replied to ${id} (${before.subject})${resolve ? " and marked it resolved" : ""}.`, link: "/employee/helpdesk" } });
  await audit(me.email, "helpdesk.reply", "HelpdeskRequest", id, { status: before.status, reply: before.reply }, { status, reply });
  revalidatePath("/admin/helpdesk");
  refreshShell();
  return { ok: true, message: resolve ? `Reply sent and ${id} marked resolved.` : `Reply sent. ${id} stays in progress.` };
}

/* ---------------- Announcements ---------------- */

const ANN_TYPES = ["HR", "Company news", "Holiday", "Reminder", "Important"] as const satisfies readonly AnnouncementTypeLabel[];
const AnnouncementSchema = z.object({
  title: z.string().trim().min(4, "Give the announcement a title (at least 4 characters).").max(120, "Keep the title under 120 characters."),
  body: z.string().trim().min(10, "Write the message (at least 10 characters).").max(3000, "Keep the message under 3,000 characters."),
  type: z.enum(ANN_TYPES, "Choose a type."),
  audience: z.string().trim().min(1, "Choose who should see it."),
});

export async function postAnnouncement(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("management", "admin");
  const parsed = AnnouncementSchema.safeParse({ title: clean(form.get("title")), body: clean(form.get("body")), type: clean(form.get("type")), audience: clean(form.get("audience")) });
  if (!parsed.success) return firstError(parsed.error);
  const { title, body, type, audience } = parsed.data;

  let recipients: { id: string }[];
  if (audience === ALL_STAFF) {
    recipients = await db.employee.findMany({ where: { status: { not: "INACTIVE" } }, select: { id: true } });
  } else {
    if (me.role !== "admin" && audience !== me.department) return { ok: false, message: "Managers can post to the whole company or to their own department." };
    const dept = await db.department.findUnique({ where: { name: audience }, select: { id: true } });
    if (!dept) return { ok: false, message: "That department doesn't exist." };
    recipients = await db.employee.findMany({ where: { departmentId: dept.id, status: { not: "INACTIVE" } }, select: { id: true } });
  }

  const a = await db.announcement.create({ data: { title, body, type: annType[type], audience, authorName: me.name, authorId: me.employeeId } });
  await db.notification.createMany({ data: recipients.filter((r) => r.id !== me.employeeId).map((r) => ({ employeeId: r.id, type: "announcement", message: `${type === "Important" ? "Important: " : ""}${title}`, link: "/employee/notifications?tab=announcements" })) });
  await audit(me.email, "announcement.post", "Announcement", a.id, undefined, { title, type, audience });
  revalidatePath("/admin/announcements");
  revalidatePath("/management/announcements");
  revalidatePath("/employee");
  refreshShell();
  const others = recipients.filter((r) => r.id !== me.employeeId).length;
  return { ok: true, message: `Published to ${audience === ALL_STAFF ? "all staff" : audience} (${others} ${others === 1 ? "person" : "people"} notified).` };
}

export async function removeAnnouncement(id: string): Promise<ActionResult> {
  const me = await authorize("management", "admin");
  const a = await db.announcement.findUnique({ where: { id }, select: { title: true, authorId: true, audience: true } });
  if (!a) return { ok: false, message: "That announcement was already removed." };
  if (me.role !== "admin" && a.authorId !== me.employeeId) return { ok: false, message: "Only HR or the person who posted it can remove it." };
  await db.announcement.delete({ where: { id } });
  await audit(me.email, "announcement.remove", "Announcement", id, a);
  revalidatePath("/admin/announcements");
  revalidatePath("/management/announcements");
  revalidatePath("/employee");
  return { ok: true, message: `Removed “${a.title}”.` };
}

/* ---------------- Notifications ---------------- */

export async function markNotificationRead(id: string) {
  const me = await authorize();
  await db.notification.updateMany({ where: { id, employeeId: me.employeeId }, data: { read: true } });
  refreshShell();
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const me = await authorize();
  const r = await db.notification.updateMany({ where: { employeeId: me.employeeId, read: false }, data: { read: true } });
  refreshShell();
  return { ok: true, message: r.count ? `Marked ${r.count} as read.` : "Nothing unread." };
}
