"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize, type CurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { approverFor, balancesFor } from "@/lib/leave";
import { addDays, dbDate, isoOf, localDate, workingDays } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const range = (from: string, to: string) => (from === to ? fmt(from) : `${fmt(from)} to ${fmt(to)}`);

async function holidaySet(from: string, to: string) {
  const rows = await db.holiday.findMany({ where: { date: { gte: dbDate(from), lte: dbDate(to) } }, select: { date: true } });
  return new Set(rows.map((h) => isoOf(h.date)));
}

async function notify(employeeId: string, type: string, message: string, link: string) {
  await db.notification.create({ data: { employeeId, type, message, link } });
}

const Apply = z.object({
  leaveTypeId: z.string().min(1, "Choose a leave type."),
  from: z.iso.date("Choose the first day."),
  to: z.iso.date("Choose the last day."),
  reason: z.string().trim().min(5, "Tell your manager the reason (at least 5 characters).").max(500),
});

export async function applyLeave(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize();
  const parsed = Apply.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { leaveTypeId, from, to, reason } = parsed.data;
  const today = localDate(new Date());
  if (to < from) return { ok: false, message: "The last day can't be before the first day." };
  if (from.slice(0, 4) !== to.slice(0, 4)) return { ok: false, message: "Leave can't cross into a new year. Please send two requests, one for each year." };
  const type = await db.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!type) return { ok: false, message: "Choose a leave type." };
  // Sick leave can be logged up to 7 days after the fact; other leave must be applied for in advance
  const earliest = type.name === "Sick" ? addDays(today, -7) : today;
  if (from < earliest) return { ok: false, message: type.name === "Sick" ? "Sick leave can be applied up to 7 days back." : `${type.name} leave must start today or later.` };

  const days = workingDays(from, to, await holidaySet(from, to)).length;
  if (days === 0) return { ok: false, message: "Those dates are all weekends or public holidays, so no leave is needed." };

  const year = Number(from.slice(0, 4));
  const bal = (await balancesFor(me.employeeId, year)).find((b) => b.typeId === leaveTypeId);
  if (!bal) return { ok: false, message: `Leave for ${year} isn't open yet. Please contact HR.` };
  const left = bal.allowed - bal.used - bal.pending;
  if (days > left) return { ok: false, message: `You have ${left} ${type.name.toLowerCase()} day${left === 1 ? "" : "s"} left${bal.pending ? ` after pending requests` : ""}, but this request needs ${days}.` };

  const clash = await db.leaveRequest.findFirst({
    where: { employeeId: me.employeeId, status: { in: ["PENDING", "APPROVED", "CANCEL_REQUESTED"] }, fromDate: { lte: dbDate(to) }, toDate: { gte: dbDate(from) } },
    select: { id: true },
  });
  if (clash) return { ok: false, message: `These dates overlap your request ${clash.id}.` };

  const approver = await approverFor(me.employeeId);
  const prefix = `LV-${year}-`;
  let id = "";
  for (let attempt = 0; attempt < 3 && !id; attempt++) {
    const last = await db.leaveRequest.findFirst({ where: { id: { startsWith: prefix } }, orderBy: { id: "desc" }, select: { id: true } });
    const candidate = `${prefix}${String(Number(last?.id.slice(prefix.length) ?? 0) + 1).padStart(4, "0")}`;
    try {
      await db.leaveRequest.create({ data: { id: candidate, employeeId: me.employeeId, leaveTypeId, fromDate: dbDate(from), toDate: dbDate(to), days, reason, approverId: approver?.id } });
      id = candidate;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e; // someone took this number; try the next one
    }
  }
  if (!id) return { ok: false, message: "We couldn't save the request. Please try again." };
  if (approver) await notify(approver.id, "leave", `${me.name} applied for ${days} day${days > 1 ? "s" : ""} of ${type.name.toLowerCase()} leave (${range(from, to)}).`, "/management/leave");
  revalidatePath("/employee/leave");
  return { ok: true, message: `Request ${id} for ${days} working day${days > 1 ? "s" : ""} sent${approver ? ` to ${approver.name}` : ""}.` };
}

export async function withdrawLeave(id: string): Promise<ActionResult> {
  const me = await authorize();
  const r = await db.leaveRequest.findUnique({ where: { id }, include: { leaveType: true } });
  if (!r || r.employeeId !== me.employeeId) return { ok: false, message: "That request wasn't found." };
  const today = localDate(new Date());
  if (r.status === "PENDING") {
    const res = await db.leaveRequest.updateMany({ where: { id, status: "PENDING" }, data: { status: "CANCELLED", decidedAt: new Date(), comment: "Withdrawn by employee" } });
    if (!res.count) return { ok: false, message: "That request was already decided. Refresh to see its status." };
    revalidatePath("/employee/leave");
    return { ok: true, message: `${id} withdrawn.` };
  }
  if (r.status === "APPROVED" && isoOf(r.fromDate) > today) {
    await db.leaveRequest.updateMany({ where: { id, status: "APPROVED" }, data: { status: "CANCEL_REQUESTED" } });
    if (r.approverId) await notify(r.approverId, "leave", `${me.name} asked to cancel approved ${r.leaveType.name.toLowerCase()} leave (${range(isoOf(r.fromDate), isoOf(r.toDate))}).`, "/management/leave");
    revalidatePath("/employee/leave");
    return { ok: true, message: "Cancellation request sent to your manager." };
  }
  return { ok: false, message: "Only pending requests, or approved leave that hasn't started yet, can be cancelled." };
}

async function canDecide(me: CurrentUser, employeeId: string) {
  if (employeeId === me.employeeId) return false;
  if (me.role === "admin") return true;
  if (me.role !== "management") return false;
  const e = await db.employee.findUnique({ where: { id: employeeId }, select: { departmentId: true, managerId: true } });
  return !!e && (e.departmentId === me.departmentId || e.managerId === me.employeeId);
}

const Decide = z.object({ id: z.string().min(1), decision: z.enum(["approve", "reject"]), comment: z.string().trim().max(300).optional() });

export async function decideLeave(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("management", "admin");
  const parsed = Decide.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Something was missing from that decision. Please try again." };
  const { id, decision } = parsed.data;
  const comment = parsed.data.comment || null;
  const r = await db.leaveRequest.findUnique({ where: { id }, include: { leaveType: true, employee: { select: { name: true } } } });
  if (!r) return { ok: false, message: "That request no longer exists." };
  if (!(await canDecide(me, r.employeeId))) return { ok: false, message: "You can't decide this request. It belongs to another team, or it's your own." };
  if (decision === "reject" && !comment) return { ok: false, message: "Write a short reason so the employee knows why." };

  const from = isoOf(r.fromDate);
  const to = isoOf(r.toDate);
  const year = Number(from.slice(0, 4));
  const balKey = { employeeId_leaveTypeId_year: { employeeId: r.employeeId, leaveTypeId: r.leaveTypeId, year } };
  const decided = { decidedAt: new Date(), approverId: me.employeeId, comment };
  let next: "APPROVED" | "REJECTED" | "CANCELLED";

  if (r.status === "PENDING") {
    if (decision === "approve") {
      const bal = await db.leaveBalance.findUnique({ where: balKey });
      if (!bal || bal.allowed - bal.used < r.days) return { ok: false, message: `${r.employee.name} doesn't have enough ${r.leaveType.name.toLowerCase()} leave left for this request.` };
      const days = workingDays(from, to, await holidaySet(from, to));
      const existing = await db.attendance.findMany({ where: { employeeId: r.employeeId, date: { gte: dbDate(from), lte: dbDate(to) } }, select: { id: true, date: true, punchInAt: true } });
      const have = new Map(existing.map((a) => [isoOf(a.date), a]));
      const ok = await db.$transaction(async (tx) => {
        const res = await tx.leaveRequest.updateMany({ where: { id, status: "PENDING" }, data: { status: "APPROVED", ...decided } });
        if (!res.count) return false;
        await tx.leaveBalance.update({ where: balKey, data: { used: { increment: r.days } } });
        // Mark the leave days on the attendance calendar, but never overwrite a real punch
        const fresh = days.filter((d) => !have.has(d));
        if (fresh.length) await tx.attendance.createMany({ data: fresh.map((d) => ({ employeeId: r.employeeId, date: dbDate(d), status: "ON_LEAVE" as const })) });
        const blanks = existing.filter((a) => !a.punchInAt && days.includes(isoOf(a.date))).map((a) => a.id);
        if (blanks.length) await tx.attendance.updateMany({ where: { id: { in: blanks } }, data: { status: "ON_LEAVE" } });
        return true;
      });
      if (!ok) return { ok: false, message: "Someone already decided this request. Refresh to see it." };
      next = "APPROVED";
    } else {
      const res = await db.leaveRequest.updateMany({ where: { id, status: "PENDING" }, data: { status: "REJECTED", ...decided } });
      if (!res.count) return { ok: false, message: "Someone already decided this request. Refresh to see it." };
      next = "REJECTED";
    }
  } else if (r.status === "CANCEL_REQUESTED") {
    if (decision === "approve") {
      const ok = await db.$transaction(async (tx) => {
        const res = await tx.leaveRequest.updateMany({ where: { id, status: "CANCEL_REQUESTED" }, data: { status: "CANCELLED", ...decided } });
        if (!res.count) return false;
        await tx.leaveBalance.update({ where: balKey, data: { used: { decrement: r.days } } });
        await tx.attendance.deleteMany({ where: { employeeId: r.employeeId, date: { gte: dbDate(from), lte: dbDate(to) }, status: "ON_LEAVE", punchInAt: null, correctedBy: null } });
        return true;
      });
      if (!ok) return { ok: false, message: "Someone already decided this request. Refresh to see it." };
      next = "CANCELLED";
    } else {
      const res = await db.leaveRequest.updateMany({ where: { id, status: "CANCEL_REQUESTED" }, data: { status: "APPROVED", ...decided } });
      if (!res.count) return { ok: false, message: "Someone already decided this request. Refresh to see it." };
      next = "APPROVED";
    }
  } else {
    return { ok: false, message: "This request has already been decided." };
  }

  const words = { APPROVED: r.status === "CANCEL_REQUESTED" ? "stays approved (cancellation declined)" : "was approved", REJECTED: "was declined", CANCELLED: "was cancelled as you asked" }[next];
  await notify(r.employeeId, "leave", `Your ${r.leaveType.name.toLowerCase()} leave (${range(from, to)}) ${words}${comment ? `: “${comment}”` : "."}`, "/employee/leave");
  await audit(me.email, `leave.${next.toLowerCase()}`, "LeaveRequest", id, { status: r.status }, { status: next, comment });
  revalidatePath("/management/leave");
  revalidatePath("/admin/leave");
  return { ok: true, message: `${r.employee.name}'s request ${words}. They've been notified.` };
}

export async function saveAllowances(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const year = Number(localDate(new Date()).slice(0, 4));
  const types = await db.leaveType.findMany();
  const updates: { id: string; name: string; before: number; after: number }[] = [];
  for (const t of types) {
    const raw = form.get(`days_${t.id}`);
    const n = Number(raw);
    if (raw === null || !Number.isInteger(n) || n < 0 || n > 60) return { ok: false, message: `${t.name} days must be a whole number from 0 to 60.` };
    if (n !== t.daysPerYear) updates.push({ id: t.id, name: t.name, before: t.daysPerYear, after: n });
  }
  if (!updates.length) return { ok: true, message: "Nothing changed." };
  await db.$transaction(updates.flatMap((u) => [db.leaveType.update({ where: { id: u.id }, data: { daysPerYear: u.after } }), db.leaveBalance.updateMany({ where: { leaveTypeId: u.id, year }, data: { allowed: u.after } })]));
  for (const u of updates) await audit(me.email, "leave.allowance", "LeaveType", u.id, { daysPerYear: u.before }, { daysPerYear: u.after });
  revalidatePath("/admin/leave");
  return { ok: true, message: `Saved. ${updates.map((u) => `${u.name}: ${u.after} days`).join(", ")} for every employee in ${year}.` };
}

const HolidaySchema = z.object({ date: z.iso.date("Choose a date."), name: z.string().trim().min(3, "Enter the holiday name.").max(80) });

export async function addHoliday(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const parsed = HolidaySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { date, name } = parsed.data;
  if (await db.holiday.findUnique({ where: { date: dbDate(date) } })) return { ok: false, message: `${fmt(date)} is already a holiday.` };
  const h = await db.holiday.create({ data: { date: dbDate(date), name } });
  await audit(me.email, "holiday.create", "Holiday", h.id, undefined, { date, name });
  revalidatePath("/admin/leave");
  return { ok: true, message: `${name} added on ${fmt(date)}.` };
}

export async function removeHoliday(id: string): Promise<ActionResult> {
  const me = await authorize("admin");
  const h = await db.holiday.findUnique({ where: { id } });
  if (!h) return { ok: false, message: "That holiday was already removed." };
  await db.holiday.delete({ where: { id } });
  await audit(me.email, "holiday.delete", "Holiday", id, { date: isoOf(h.date), name: h.name });
  revalidatePath("/admin/leave");
  return { ok: true, message: `${h.name} removed.` };
}
