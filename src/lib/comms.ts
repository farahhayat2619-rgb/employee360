import "server-only";
import type { AnnouncementType, HelpdeskStatus, Prisma, TicketStatus } from "@/generated/prisma/client";
import { requirePortal, type CurrentUser } from "./auth";
import { db } from "./db";
import { localDate, localTime } from "./time";
import type { AnnouncementTypeLabel, AnnouncementView, HelpdeskStatusLabel, HelpdeskView, NotificationView, TicketCounts, TicketStatusLabel, TicketView } from "./types";

/** "YYYY-MM-DD HH:MM" in office time. */
export const stamp = (d: Date) => `${localDate(d)} ${localTime(d)}`;

/* ---------------- Complaint tickets ---------------- */

export const ticketLabel: Record<TicketStatus, TicketStatusLabel> = { OPEN: "Open", PENDING: "Pending", CLOSED: "Closed" };

const ticketSelect = {
  id: true,
  subject: true,
  description: true,
  submittedById: true,
  submittedBy: { select: { name: true } },
  department: true,
  forwardedTo: true,
  status: true,
  latestUpdate: true,
  resolution: true,
  createdAt: true,
  updates: { orderBy: { at: "asc" }, select: { at: true, action: true, note: true, by: { select: { name: true } } } },
} satisfies Prisma.TicketSelect;

const toTicket = (t: Prisma.TicketGetPayload<{ select: typeof ticketSelect }>): TicketView => ({
  id: t.id,
  subject: t.subject,
  description: t.description,
  submittedBy: t.submittedBy.name,
  employeeId: t.submittedById,
  department: t.department,
  submitted: localDate(t.createdAt),
  forwardedTo: t.forwardedTo,
  status: ticketLabel[t.status],
  latestUpdate: t.latestUpdate,
  resolution: t.resolution,
  history: t.updates.map((u) => ({ at: stamp(u.at), by: u.by.name, action: u.action, note: u.note })),
});

const newestFirst = { createdAt: "desc" } as const;

export async function myTickets() {
  const me = await requirePortal("employee");
  const rows = await db.ticket.findMany({ where: { submittedById: me.employeeId }, orderBy: newestFirst, select: ticketSelect });
  return { me: { id: me.employeeId, name: me.name, department: me.department }, tickets: rows.map(toTicket) };
}

/** Management sees every complaint: all of them come to management first, whichever department raised them. */
export async function ticketReviewQueue() {
  const me = await requirePortal("management");
  const [rows, departments] = await Promise.all([
    db.ticket.findMany({ orderBy: newestFirst, select: ticketSelect }),
    db.department.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  return { meId: me.employeeId, tickets: rows.map(toTicket), departments: departments.map((d) => d.name) };
}

/** Tickets management forwarded to the signed-in employee's department. */
export async function departmentInbox() {
  const me = await requirePortal("employee");
  const rows = await db.ticket.findMany({ where: { forwardedTo: me.department }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], select: ticketSelect });
  return { meId: me.employeeId, department: me.department, tickets: rows.map(toTicket) };
}

export async function ticketCounts(where: Prisma.TicketWhereInput = {}): Promise<TicketCounts> {
  const groups = await db.ticket.groupBy({ by: ["status"], where, _count: true });
  const n = (s: TicketStatus) => groups.find((g) => g.status === s)?._count ?? 0;
  return { open: n("OPEN"), pending: n("PENDING"), closed: n("CLOSED") };
}

/* ---------------- HR helpdesk ---------------- */

export const helpdeskLabel: Record<HelpdeskStatus, HelpdeskStatusLabel> = { OPEN: "Open", IN_PROGRESS: "In progress", RESOLVED: "Resolved" };

const helpdeskSelect = {
  id: true,
  employeeId: true,
  employee: { select: { name: true, department: { select: { name: true } } } },
  subject: true,
  message: true,
  status: true,
  reply: true,
  repliedBy: true,
  createdAt: true,
} satisfies Prisma.HelpdeskRequestSelect;

const toHelpdesk = (h: Prisma.HelpdeskRequestGetPayload<{ select: typeof helpdeskSelect }>): HelpdeskView => ({
  id: h.id,
  employeeId: h.employeeId,
  from: h.employee.name,
  department: h.employee.department.name,
  subject: h.subject,
  message: h.message,
  status: helpdeskLabel[h.status],
  reply: h.reply,
  repliedBy: h.repliedBy,
  created: localDate(h.createdAt),
});

export async function myHelpdesk() {
  const me = await requirePortal("employee");
  const rows = await db.helpdeskRequest.findMany({ where: { employeeId: me.employeeId }, orderBy: { createdAt: "desc" }, select: helpdeskSelect });
  return rows.map(toHelpdesk);
}

export async function allHelpdesk() {
  await requirePortal("admin");
  const rows = await db.helpdeskRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], select: helpdeskSelect });
  return rows.map(toHelpdesk);
}

/* ---------------- Announcements ---------------- */

export const annLabel: Record<AnnouncementType, AnnouncementTypeLabel> = { HR: "HR", COMPANY_NEWS: "Company news", HOLIDAY: "Holiday", REMINDER: "Reminder", IMPORTANT: "Important" };
export const annType = Object.fromEntries(Object.entries(annLabel).map(([k, v]) => [v, k])) as Record<AnnouncementTypeLabel, AnnouncementType>;
export const ALL_STAFF = "All staff";

const annRow = (a: { id: string; title: string; body: string; type: AnnouncementType; audience: string; authorName: string; authorId: string | null; publishedAt: Date }, me: CurrentUser): AnnouncementView => ({
  id: a.id,
  title: a.title,
  body: a.body,
  type: annLabel[a.type],
  audience: a.audience,
  author: a.authorName,
  date: localDate(a.publishedAt),
  canRemove: me.role === "admin" || a.authorId === me.employeeId,
});

/** What an employee sees: company-wide posts plus posts for their own department. */
export async function myAnnouncements(limit?: number) {
  const me = await requirePortal("employee");
  const rows = await db.announcement.findMany({ where: { audience: { in: [ALL_STAFF, me.department] } }, orderBy: { publishedAt: "desc" }, take: limit });
  return rows.map((a) => annRow(a, me));
}

/** Management and HR see everything that has been posted, so nothing is announced twice. */
export async function announcementsAdmin(portal: "management" | "admin") {
  const me = await requirePortal(portal);
  const [rows, departments] = await Promise.all([
    db.announcement.findMany({ orderBy: { publishedAt: "desc" } }),
    db.department.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  // Management can post to the whole company or to their own department; HR to any department.
  const audiences = [ALL_STAFF, ...(me.role === "admin" ? departments.map((d) => d.name) : [me.department])];
  return { announcements: rows.map((a) => annRow(a, me)), audiences };
}

/* ---------------- Notifications ---------------- */

export async function myNotifications() {
  const me = await requirePortal("employee");
  const rows = await db.notification.findMany({ where: { employeeId: me.employeeId }, orderBy: { createdAt: "desc" }, take: 100 });
  const list: NotificationView[] = rows.map((n) => ({ id: n.id, type: n.type.toLowerCase(), message: n.message, link: n.link, read: n.read, at: stamp(n.createdAt) }));
  return { notifications: list, today: localDate(new Date()) };
}
