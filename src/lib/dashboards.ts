import "server-only";
import { attendanceBoard } from "./attendance";
import { requirePortal } from "./auth";
import { ticketCounts } from "./comms";
import { db } from "./db";
import { leaveForApproval } from "./leave";
import { teamPerformance } from "./performance";
import { departmentSummaries } from "./queries";
import { isoOf, localDate, monthEnd, monthLabel, shiftMonth } from "./time";
import type { BoardRow } from "./types";

function tallyToday(rows: BoardRow[]) {
  const n = (...s: BoardRow["status"][]) => rows.filter((r) => s.includes(r.status)).length;
  return { present: n("Present"), late: n("Late"), absent: n("Absent", "Not punched in"), onLeave: n("On leave"), off: n("Weekend", "Holiday") };
}

/**
 * Attendance trend for the dashboard chart. Early in a month there are only a few days to plot,
 * so fall back to the previous full month.
 */
async function trendFor(portal: "management" | "admin", board: Awaited<ReturnType<typeof attendanceBoard>>) {
  if (board.trend.length >= 5) return { trend: board.trend, month: board.month };
  const prev = shiftMonth(board.month, -1);
  const older = await attendanceBoard(portal, monthEnd(prev));
  return { trend: older.trend, month: prev };
}

const todayLabel = () => new Date(`${localDate(new Date())}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function managementDashboard() {
  const me = await requirePortal("management");
  const [board, leave, perf, depts, counts, newTickets] = await Promise.all([
    attendanceBoard("management"),
    leaveForApproval("management"),
    teamPerformance("management"),
    departmentSummaries("management"),
    ticketCounts(),
    db.ticket.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, subject: true, department: true, submittedBy: { select: { name: true } } } }),
  ]);
  const { trend, month } = await trendFor("management", board);
  const withGoals = perf.rows.filter((r) => r.avgProgress !== null);
  return {
    department: me.department,
    dateLabel: todayLabel(),
    teamSize: board.rows.length,
    offDay: board.holiday ?? (board.weekend ? "Weekend" : null),
    today: tallyToday(board.rows),
    pendingLeave: leave.rows.filter((l) => l.status === "Pending" || l.status === "Cancel requested").slice(0, 5),
    tickets: counts,
    newTickets: newTickets.map((t) => ({ id: t.id, subject: t.subject, by: t.submittedBy.name, department: t.department })),
    goalAvg: withGoals.length ? Math.round(withGoals.reduce((s, r) => s + (r.avgProgress ?? 0), 0) / withGoals.length) : null,
    goalPeople: withGoals.slice(0, 5).map((r) => ({ id: r.id, name: r.name, progress: r.avgProgress ?? 0 })),
    trend,
    trendMonth: monthLabel(month),
    deptRates: depts.filter((d) => d.attendanceRate !== null).map((d) => ({ dept: d.name, rate: d.attendanceRate as number })),
  };
}

export async function adminDashboard() {
  await requirePortal("admin");
  const [board, statusCounts, deptCount, pendingLeave, helpdeskOpen, counts, lastPublished] = await Promise.all([
    attendanceBoard("admin"),
    db.employee.groupBy({ by: ["status"], _count: { _all: true } }),
    db.department.count(),
    db.leaveRequest.count({ where: { status: { in: ["PENDING", "CANCEL_REQUESTED"] } } }),
    db.helpdeskRequest.count({ where: { status: { not: "RESOLVED" } } }),
    ticketCounts(),
    db.payslip.findFirst({ where: { published: true }, orderBy: { month: "desc" }, select: { month: true } }),
  ]);
  const { trend, month } = await trendFor("admin", board);

  let payroll: { month: string; net: number; byDept: { dept: string; net: number }[] } | null = null;
  if (lastPublished) {
    const slips = await db.payslip.findMany({ where: { month: lastPublished.month, published: true }, select: { net: true, employee: { select: { department: { select: { name: true } } } } } });
    const byDept = new Map<string, number>();
    for (const s of slips) byDept.set(s.employee.department.name, (byDept.get(s.employee.department.name) ?? 0) + s.net);
    payroll = {
      month: monthLabel(isoOf(lastPublished.month).slice(0, 7)),
      net: slips.reduce((s, x) => s + x.net, 0),
      byDept: [...byDept.entries()].map(([dept, net]) => ({ dept, net })).sort((a, b) => b.net - a.net),
    };
  }

  const n = (s: string) => statusCounts.find((c) => c.status === s)?._count._all ?? 0;
  const total = statusCounts.reduce((s, c) => s + c._count._all, 0);
  return {
    dateLabel: todayLabel(),
    total,
    active: total - n("INACTIVE"),
    inactive: n("INACTIVE"),
    departments: deptCount,
    pendingLeave,
    helpdeskOpen,
    offDay: board.holiday ?? (board.weekend ? "Weekend" : null),
    today: tallyToday(board.rows),
    trend,
    trendMonth: monthLabel(month),
    payroll,
    tickets: counts,
  };
}
