import "server-only";
import type { AttendanceStatus } from "@/generated/prisma/client";
import { requirePortal } from "./auth";
import { db } from "./db";
import { dbDate, eachDay, isoOf, isWeekend, localDate, localTime, monthEnd, monthStart, shiftMonth } from "./time";
import type { AttendanceDay, BoardRow, DayStatus, MonthSummary, OfficeInfo, TodayPunch } from "./types";

// Every query authorizes itself, because layouts are not re-run on client-side navigation.

const label: Record<AttendanceStatus, DayStatus> = { PRESENT: "Present", LATE: "Late", ABSENT: "Absent", ON_LEAVE: "On leave" };

type Rec = {
  date: Date;
  punchInAt: Date | null;
  punchOutAt: Date | null;
  punchInDistM: number | null;
  officeName: string | null;
  minutesWorked: number;
  status: AttendanceStatus;
  earlyLeave: boolean;
  gpsVerified: boolean;
  correctedBy: string | null;
  correctionNote: string | null;
};
const recSelect = { date: true, punchInAt: true, punchOutAt: true, punchInDistM: true, officeName: true, minutesWorked: true, status: true, earlyLeave: true, gpsVerified: true, correctedBy: true, correctionNote: true } as const;

/** Turns one calendar day into a display row. Days before tracking started return null. */
function dayRow(date: string, rec: Rec | undefined, holidays: Map<string, string>, today: string, trackFrom: string): AttendanceDay | null {
  if (rec) {
    return {
      date,
      in: rec.punchInAt && localTime(rec.punchInAt),
      out: rec.punchOutAt && localTime(rec.punchOutAt),
      hours: rec.minutesWorked / 60,
      status: label[rec.status],
      early: rec.earlyLeave,
      location: rec.officeName,
      distance: rec.punchInDistM,
      gpsVerified: rec.gpsVerified,
      corrected: !!rec.correctedBy,
      note: rec.correctionNote,
    };
  }
  if (date < trackFrom) return null;
  const blank = { date, in: null, out: null, hours: 0, early: false, location: null, distance: null, gpsVerified: false, corrected: false, note: null };
  if (holidays.has(date)) return { ...blank, status: "Holiday", location: holidays.get(date)! };
  if (isWeekend(date)) return { ...blank, status: "Weekend" };
  if (date === today) return { ...blank, status: "Not punched in" };
  return { ...blank, status: "Absent" };
}

function summarize(month: string, days: AttendanceDay[]): MonthSummary {
  const work = days.filter((d) => d.status !== "Weekend" && d.status !== "Holiday" && d.status !== "Not punched in");
  return {
    month,
    workdays: work.length,
    present: work.filter((d) => d.status === "Present" || d.status === "Late").length,
    late: work.filter((d) => d.status === "Late").length,
    early: work.filter((d) => d.early).length,
    leave: work.filter((d) => d.status === "On leave").length,
    absent: work.filter((d) => d.status === "Absent").length,
    hours: Math.round(work.reduce((s, d) => s + d.hours, 0) * 10) / 10,
  };
}

async function holidayMap(from: string, to: string) {
  const rows = await db.holiday.findMany({ where: { date: { gte: dbDate(from), lte: dbDate(to) } } });
  return new Map(rows.map((h) => [isoOf(h.date), h.name]));
}

function toTodayPunch(date: string, rec: (Rec & { punchInAccM: number | null; punchOutDistM: number | null; late: boolean }) | null): TodayPunch {
  return {
    date,
    in: rec?.punchInAt ? localTime(rec.punchInAt) : null,
    out: rec?.punchOutAt ? localTime(rec.punchOutAt) : null,
    office: rec?.officeName ?? null,
    inDist: rec?.punchInDistM ?? null,
    inAcc: rec?.punchInAccM ?? null,
    outDist: rec?.punchOutDistM ?? null,
    minutes: rec?.minutesWorked ?? 0,
    late: rec?.late ?? false,
    early: rec?.earlyLeave ?? false,
    onLeave: rec?.status === "ON_LEAVE",
    gpsVerified: rec?.gpsVerified ?? false,
  };
}

/** The signed-in person's punch card for today, plus their office rules. */
export async function myPunchCard(): Promise<{ today: TodayPunch; office: OfficeInfo }> {
  const me = await requirePortal("employee");
  const today = localDate(new Date());
  const [emp, rec] = await Promise.all([
    db.employee.findUniqueOrThrow({ where: { id: me.employeeId }, select: { office: { select: { name: true, workStart: true, workEnd: true, graceMin: true, radiusM: true } } } }),
    db.attendance.findUnique({ where: { employeeId_date: { employeeId: me.employeeId, date: dbDate(today) } }, select: { ...recSelect, punchInAccM: true, punchOutDistM: true, late: true } }),
  ]);
  return { today: toTodayPunch(today, rec), office: emp.office };
}

/** One month of the signed-in person's attendance, newest first, plus a monthly history. */
export async function myAttendance(monthParam?: string) {
  const me = await requirePortal("employee");
  const today = localDate(new Date());
  const thisMonth = today.slice(0, 7);
  const first = await db.attendance.findFirst({ where: { employeeId: me.employeeId }, orderBy: { date: "asc" }, select: { date: true } });
  const emp = await db.employee.findUniqueOrThrow({ where: { id: me.employeeId }, select: { joiningDate: true } });
  // Tracking starts at the first record (or joining date, if later). Earlier days are not "absent".
  const firstIso = first ? isoOf(first.date) : today;
  const trackFrom = [firstIso, isoOf(emp.joiningDate)].sort()[1];
  const earliestMonth = trackFrom.slice(0, 7);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) && monthParam <= thisMonth && monthParam >= earliestMonth ? monthParam : thisMonth;

  const histFrom = [monthStart(shiftMonth(thisMonth, -5)), monthStart(earliestMonth)].sort()[1];
  const from = [monthStart(month), histFrom].sort()[0];
  const [recs, holidays] = await Promise.all([
    db.attendance.findMany({ where: { employeeId: me.employeeId, date: { gte: dbDate(from), lte: dbDate(today) } }, select: recSelect }),
    holidayMap(from, monthEnd(thisMonth)),
  ]);
  const byDate = new Map(recs.map((r) => [isoOf(r.date), r]));
  const rows = (a: string, b: string) => eachDay(a, b).map((d) => dayRow(d, byDate.get(d), holidays, today, trackFrom)).filter((d): d is AttendanceDay => d !== null);

  const days = rows(monthStart(month), [monthEnd(month), today].sort()[0]);
  const history: MonthSummary[] = [];
  for (let m = thisMonth; m >= earliestMonth && history.length < 6; m = shiftMonth(m, -1)) {
    history.push(summarize(m, rows(monthStart(m), [monthEnd(m), today].sort()[0])));
  }
  return {
    month,
    prevMonth: month > earliestMonth ? shiftMonth(month, -1) : null,
    nextMonth: month < thisMonth ? shiftMonth(month, 1) : null,
    days: days.reverse(),
    summary: summarize(month, days),
    history,
  };
}

/** Last 30 days for the dashboard tiles. */
export async function myLast30Days() {
  const me = await requirePortal("employee");
  const today = localDate(new Date());
  const from = isoOf(new Date(dbDate(today).getTime() - 29 * 86_400_000));
  const [recs, holidays, emp, first] = await Promise.all([
    db.attendance.findMany({ where: { employeeId: me.employeeId, date: { gte: dbDate(from), lte: dbDate(today) } }, select: recSelect }),
    holidayMap(from, today),
    db.employee.findUniqueOrThrow({ where: { id: me.employeeId }, select: { joiningDate: true } }),
    db.attendance.findFirst({ where: { employeeId: me.employeeId }, orderBy: { date: "asc" }, select: { date: true } }),
  ]);
  const trackFrom = [first ? isoOf(first.date) : today, isoOf(emp.joiningDate)].sort()[1];
  const byDate = new Map(recs.map((r) => [isoOf(r.date), r]));
  const days = eachDay(from, today).map((d) => dayRow(d, byDate.get(d), holidays, today, trackFrom)).filter((d): d is AttendanceDay => d !== null);
  return summarize("last30", days);
}

/** Calendar cells for the current month (dashboard / attendance page). */
export async function myCalendar(month?: string) {
  const data = await myAttendance(month);
  return { month: data.month, days: [...data.days].reverse() };
}

/** Who's in on a given day. Management sees their own department; Admin / HR sees everyone. */
export async function attendanceBoard(portal: "management" | "admin", dateParam?: string) {
  const me = await requirePortal(portal);
  const today = localDate(new Date());
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam <= today ? dateParam : today;
  const scope = portal === "management" ? { departmentId: me.departmentId } : {};
  const month = date.slice(0, 7);

  const [emps, holiday, monthRecs] = await Promise.all([
    db.employee.findMany({
      where: { ...scope, status: { not: "INACTIVE" }, joiningDate: { lte: dbDate(date) } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        department: { select: { name: true } },
        office: { select: { name: true } },
        attendance: { where: { date: dbDate(date) }, select: { ...recSelect, punchInAccM: true } },
      },
    }),
    db.holiday.findUnique({ where: { date: dbDate(date) } }),
    db.attendance.groupBy({
      by: ["date", "status"],
      where: { employee: scope, date: { gte: dbDate(monthStart(month)), lte: dbDate([monthEnd(month), today].sort()[0]) } },
      _count: { _all: true },
    }),
  ]);

  const off: DayStatus | null = holiday ? "Holiday" : isWeekend(date) ? "Weekend" : null;
  const rows: BoardRow[] = emps.map((e) => {
    const r = e.attendance[0];
    const status: DayStatus = r ? label[r.status] : (off ?? (date === today ? "Not punched in" : "Absent"));
    return {
      id: e.id,
      name: e.name,
      department: e.department.name,
      office: e.office.name,
      in: r?.punchInAt ? localTime(r.punchInAt) : null,
      out: r?.punchOutAt ? localTime(r.punchOutAt) : null,
      distance: r?.punchInDistM ?? null,
      accuracy: r?.punchInAccM ?? null,
      status,
      early: r?.earlyLeave ?? false,
      gpsVerified: r?.gpsVerified ?? false,
      corrected: !!r?.correctedBy,
      note: r?.correctionNote ?? null,
    };
  });

  const perDay = new Map<string, { present: number; total: number }>();
  for (const g of monthRecs) {
    const d = isoOf(g.date);
    const t = perDay.get(d) ?? { present: 0, total: 0 };
    t.total += g._count._all;
    if (g.status === "PRESENT" || g.status === "LATE") t.present += g._count._all;
    perDay.set(d, t);
  }
  const trend = [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, t]) => t.total > 0)
    .map(([d, t]) => ({ day: new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), rate: Math.round((t.present / t.total) * 100) }));

  return { date, today, holiday: holiday?.name ?? null, weekend: isWeekend(date), rows, trend, month, scopeDept: portal === "management" ? me.department : null };
}
