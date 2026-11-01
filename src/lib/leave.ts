import "server-only";
import type { LeaveStatus, Prisma } from "@/generated/prisma/client";
import { requirePortal } from "./auth";
import { db } from "./db";
import { dbDate, isoOf, localDate } from "./time";
import type { LeaveBalanceRow, LeaveRow, LeaveStatusLabel } from "./types";

export const leaveLabel: Record<LeaveStatus, LeaveStatusLabel> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", CANCEL_REQUESTED: "Cancel requested", CANCELLED: "Cancelled" };

const rowSelect = {
  id: true,
  employeeId: true,
  employee: { select: { name: true, department: { select: { name: true } } } },
  leaveType: { select: { name: true } },
  fromDate: true,
  toDate: true,
  days: true,
  reason: true,
  status: true,
  comment: true,
  approver: { select: { name: true } },
  createdAt: true,
} satisfies Prisma.LeaveRequestSelect;

function toRow(r: Prisma.LeaveRequestGetPayload<{ select: typeof rowSelect }>): LeaveRow {
  return {
    id: r.id,
    employeeId: r.employeeId,
    employee: r.employee.name,
    department: r.employee.department.name,
    type: r.leaveType.name,
    from: isoOf(r.fromDate),
    to: isoOf(r.toDate),
    days: r.days,
    reason: r.reason,
    status: leaveLabel[r.status],
    comment: r.comment,
    approver: r.approver?.name ?? null,
    applied: isoOf(r.createdAt),
  };
}

/** Who decides an employee's leave: their reporting manager, or else their department head. */
export async function approverFor(employeeId: string) {
  const e = await db.employee.findUniqueOrThrow({ where: { id: employeeId }, select: { manager: { select: { id: true, name: true } }, department: { select: { head: { select: { id: true, name: true } } } } } });
  const head = e.department.head && e.department.head.id !== employeeId ? e.department.head : null;
  return e.manager ?? head;
}

export async function balancesFor(employeeId: string, year: number): Promise<LeaveBalanceRow[]> {
  const [balances, pending] = await Promise.all([
    db.leaveBalance.findMany({ where: { employeeId, year }, include: { leaveType: true }, orderBy: { leaveType: { name: "asc" } } }),
    db.leaveRequest.groupBy({ by: ["leaveTypeId"], where: { employeeId, status: "PENDING", fromDate: { gte: dbDate(`${year}-01-01`), lte: dbDate(`${year}-12-31`) } }, _sum: { days: true } }),
  ]);
  const p = new Map(pending.map((x) => [x.leaveTypeId, x._sum.days ?? 0]));
  return balances.map((b) => ({ typeId: b.leaveTypeId, type: b.leaveType.name, allowed: b.allowed, used: b.used, pending: p.get(b.leaveTypeId) ?? 0 }));
}

/** The signed-in person's balances and requests. */
export async function myLeave() {
  const me = await requirePortal("employee");
  const today = localDate(new Date());
  const year = Number(today.slice(0, 4));
  const [balances, requests, approver, holidays] = await Promise.all([
    balancesFor(me.employeeId, year),
    db.leaveRequest.findMany({ where: { employeeId: me.employeeId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: rowSelect }),
    approverFor(me.employeeId),
    db.holiday.findMany({ where: { date: { gte: dbDate(`${year}-01-01`) } }, orderBy: { date: "asc" } }),
  ]);
  return { today, year, balances, requests: requests.map(toRow), approver: approver?.name ?? null, holidays: holidays.map((h) => isoOf(h.date)) };
}

/** Requests a manager or HR can decide. Management: their department and direct reports, never their own. */
export async function leaveForApproval(portal: "management" | "admin") {
  const me = await requirePortal(portal);
  const where: Prisma.LeaveRequestWhereInput =
    portal === "admin" ? { employeeId: { not: me.employeeId } } : { employeeId: { not: me.employeeId }, employee: { OR: [{ departmentId: me.departmentId }, { managerId: me.employeeId }] } };
  const rows = await db.leaveRequest.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: rowSelect, take: 300 });
  return { rows: rows.map(toRow), today: localDate(new Date()) };
}

export async function upcomingHolidays(limit = 4) {
  await requirePortal("employee");
  const today = localDate(new Date());
  const rows = await db.holiday.findMany({ where: { date: { gte: dbDate(today) } }, orderBy: { date: "asc" }, take: limit });
  return rows.map((h) => ({ date: isoOf(h.date), name: h.name }));
}

export async function leaveSettings() {
  await requirePortal("admin");
  const today = localDate(new Date());
  const [types, holidays] = await Promise.all([
    db.leaveType.findMany({ orderBy: { name: "asc" } }),
    db.holiday.findMany({ where: { date: { gte: dbDate(`${today.slice(0, 4)}-01-01`) } }, orderBy: { date: "asc" } }),
  ]);
  return { year: Number(today.slice(0, 4)), types: types.map((t) => ({ id: t.id, name: t.name, daysPerYear: t.daysPerYear })), holidays: holidays.map((h) => ({ id: h.id, date: isoOf(h.date), name: h.name })) };
}
