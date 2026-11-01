import "server-only";
import type { AttendanceStatus, Prisma } from "@/generated/prisma/client";
import { requirePortal } from "./auth";
import { ticketLabel } from "./comms";
import { db } from "./db";
import { leaveLabel } from "./leave";
import { addDays, dbDate, eachDay, isoOf, isWeekend, localDate, localTime, monthLabel, shiftMonth } from "./time";

export { REPORTS } from "./report-types";
export type { ReportChart, ReportColumn, ReportData, ReportId, ReportRow } from "./report-types";
import { REPORTS, type ReportData, type ReportId, type ReportRow } from "./report-types";

const MAX_DAYS = 366;
const STATUS: Record<AttendanceStatus, string> = { PRESENT: "Present", LATE: "Late", ABSENT: "Absent", ON_LEAVE: "On leave" };
const isIso = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const hours = (min: number) => Math.round((min / 60) * 10) / 10;
const countBy = (rows: ReportRow[], key: string) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(String(r[key]), (m.get(String(r[key])) ?? 0) + 1);
  return [...m.entries()].map(([k, count]) => ({ [key]: k, count }));
};

/** Reads and sanitises the filters from the URL. Management is always limited to their own department. */
export async function runReport(portal: "management" | "admin", params: { report?: string; from?: string; to?: string; dept?: string }): Promise<ReportData> {
  const me = await requirePortal(portal);
  const today = localDate(new Date());
  const meta = REPORTS.find((r) => r.id === params.report) ?? REPORTS[0];

  let to = isIso(params.to) && params.to <= today ? params.to : today;
  let from = isIso(params.from) ? params.from : `${shiftMonth(today.slice(0, 7), -1)}-01`;
  if (from > to) [from, to] = [to, from];
  if (eachDay(from, to).length > MAX_DAYS) from = addDays(to, -(MAX_DAYS - 1));

  const allDepts = (await db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })).map((d) => d.name);
  const lockedDept = portal === "management" ? me.department : null;
  const dept = lockedDept ?? (params.dept && allDepts.includes(params.dept) ? params.dept : "All");
  const empScope: Prisma.EmployeeWhereInput = dept === "All" ? {} : { department: { name: dept } };

  const base = { id: meta.id, name: meta.name, from, to, dept, departments: lockedDept ? [] : allDepts, lockedDept, today, note: null };
  const ctx = { from, to, today, dept, empScope, allDepts };
  const body = await builders[meta.id](ctx);
  return { ...base, ...body };
}

type Ctx = { from: string; to: string; today: string; dept: string; empScope: Prisma.EmployeeWhereInput; allDepts: string[] };
type Body = Pick<ReportData, "columns" | "rows" | "chart"> & { note?: string | null };

/** Working days per person in the range: after they joined, after tracking began, up to yesterday (today isn't over). */
async function attendanceGrid(c: Ctx) {
  const [emps, holidays, first] = await Promise.all([
    db.employee.findMany({
      where: { ...c.empScope, status: { not: "INACTIVE" }, joiningDate: { lte: dbDate(c.to) } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        joiningDate: true,
        department: { select: { name: true } },
        attendance: { where: { date: { gte: dbDate(c.from), lte: dbDate(c.to) } }, select: { date: true, status: true, minutesWorked: true } },
      },
    }),
    db.holiday.findMany({ where: { date: { gte: dbDate(c.from), lte: dbDate(c.to) } }, select: { date: true } }),
    db.attendance.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
  ]);
  const off = new Set(holidays.map((h) => isoOf(h.date)));
  const trackFrom = first ? isoOf(first.date) : c.today;
  const days = eachDay(c.from, c.to).filter((d) => !isWeekend(d) && !off.has(d) && d >= trackFrom);
  return { emps, days };
}

const builders: Record<ReportId, (c: Ctx) => Promise<Body>> = {
  async daily(c) {
    const date = c.to;
    const [emps, holiday] = await Promise.all([
      db.employee.findMany({
        where: { ...c.empScope, status: { not: "INACTIVE" }, joiningDate: { lte: dbDate(date) } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, department: { select: { name: true } }, attendance: { where: { date: dbDate(date) }, select: { status: true, punchInAt: true, punchOutAt: true, minutesWorked: true, gpsVerified: true, correctedBy: true } } },
      }),
      db.holiday.findUnique({ where: { date: dbDate(date) } }),
    ]);
    const offDay = holiday ? "Holiday" : isWeekend(date) ? "Weekend" : null;
    const rows = emps.map((e) => {
      const r = e.attendance[0];
      return {
        Employee: e.name,
        ID: e.id,
        Department: e.department.name,
        "Punch in": r?.punchInAt ? localTime(r.punchInAt) : "—",
        "Punch out": r?.punchOutAt ? localTime(r.punchOutAt) : "—",
        Hours: r ? hours(r.minutesWorked) : 0,
        Status: r ? STATUS[r.status] : (offDay ?? (date === c.today ? "Not punched in" : "Absent")),
        Source: !r ? "—" : r.correctedBy ? "Corrected by HR" : r.gpsVerified ? "GPS verified" : "Demo data",
      };
    });
    return {
      columns: [{ key: "Employee", header: "Employee" }, { key: "ID", header: "ID" }, { key: "Department", header: "Department" }, { key: "Punch in", header: "Punch in" }, { key: "Punch out", header: "Punch out" }, { key: "Hours", header: "Hours", kind: "num" }, { key: "Status", header: "Status", kind: "status" }, { key: "Source", header: "Source" }],
      rows,
      chart: { type: "bars", title: "Staff by status", data: countBy(rows, "Status"), x: "Status", y: "count" },
      note: `Showing ${new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}, the end date of the range.${holiday ? ` ${holiday.name} is a public holiday.` : ""}`,
    };
  },

  async monthly(c) {
    const { emps, days } = await attendanceGrid(c);
    const past = days.filter((d) => d < c.today);
    const perDay = new Map<string, number>();
    const rows = emps.map((e) => {
      const joined = isoOf(e.joiningDate);
      const mine = past.filter((d) => d >= joined);
      const recs = new Map(e.attendance.map((a) => [isoOf(a.date), a.status]));
      let present = 0, late = 0, leave = 0;
      for (const d of mine) {
        const s = recs.get(d);
        if (s === "PRESENT" || s === "LATE") perDay.set(d, (perDay.get(d) ?? 0) + 1);
        if (s === "PRESENT") present++;
        else if (s === "LATE") late++;
        else if (s === "ON_LEAVE") leave++;
      }
      const absent = mine.length - present - late - leave;
      return { Employee: e.name, Department: e.department.name, "Working days": mine.length, Present: present + late, Late: late, "On leave": leave, Absent: absent, "Attendance %": pct(present + late, mine.length - leave) };
    });
    const trend = past.map((d) => ({ day: new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), rate: pct(perDay.get(d) ?? 0, emps.filter((e) => isoOf(e.joiningDate) <= d).length) }));
    return {
      columns: [{ key: "Employee", header: "Employee" }, { key: "Department", header: "Department" }, { key: "Working days", header: "Working days", kind: "num" }, { key: "Present", header: "Present", kind: "num" }, { key: "Late", header: "Late", kind: "num" }, { key: "On leave", header: "On leave", kind: "num" }, { key: "Absent", header: "Absent", kind: "num" }, { key: "Attendance %", header: "Attendance", kind: "pct" }],
      rows,
      chart: trend.length ? { type: "line", title: "Share of staff in each working day", data: trend, x: "day", y: "rate" } : null,
      note: "Present includes late arrivals. Attendance % leaves out approved leave days. Today is not counted until the day is over.",
    };
  },

  async leave(c) {
    const reqs = await db.leaveRequest.findMany({
      where: { employee: c.empScope, fromDate: { lte: dbDate(c.to) }, toDate: { gte: dbDate(c.from) } },
      orderBy: [{ fromDate: "desc" }, { id: "desc" }],
      select: { id: true, fromDate: true, toDate: true, days: true, status: true, employee: { select: { name: true, department: { select: { name: true } } } }, leaveType: { select: { name: true } }, approver: { select: { name: true } } },
    });
    const rows = reqs.map((r) => ({ Request: r.id, Employee: r.employee.name, Department: r.employee.department.name, Type: r.leaveType.name, From: isoOf(r.fromDate), To: isoOf(r.toDate), Days: r.days, Status: leaveLabel[r.status], Approver: r.approver?.name ?? "—" }));
    const byType = new Map<string, number>();
    for (const r of reqs) if (r.status === "APPROVED") byType.set(r.leaveType.name, (byType.get(r.leaveType.name) ?? 0) + r.days);
    return {
      columns: [{ key: "Request", header: "Request" }, { key: "Employee", header: "Employee" }, { key: "Department", header: "Department" }, { key: "Type", header: "Type" }, { key: "From", header: "From" }, { key: "To", header: "To" }, { key: "Days", header: "Days", kind: "num" }, { key: "Status", header: "Status", kind: "status" }, { key: "Approver", header: "Approver" }],
      rows,
      chart: byType.size ? { type: "donut", title: "Approved leave days by type", data: [...byType.entries()].map(([type, days]) => ({ type, days })), x: "type", y: "days" } : null,
      note: "Requests that overlap the date range, in any status.",
    };
  },

  async dept(c) {
    const { emps, days } = await attendanceGrid(c);
    const past = days.filter((d) => d < c.today);
    const names = c.dept === "All" ? c.allDepts : [c.dept];
    const rows = names.map((name) => {
      const staff = emps.filter((e) => e.department.name === name);
      let possible = 0, inCount = 0, late = 0, leave = 0;
      for (const e of staff) {
        const joined = isoOf(e.joiningDate);
        const recs = new Map(e.attendance.map((a) => [isoOf(a.date), a.status]));
        for (const d of past) {
          if (d < joined) continue;
          possible++;
          const s = recs.get(d);
          if (s === "PRESENT" || s === "LATE") inCount++;
          if (s === "LATE") late++;
          if (s === "ON_LEAVE") leave++;
        }
      }
      return { Department: name, Staff: staff.length, "Person-days": possible, Present: inCount, Late: late, "Leave days": leave, "Attendance %": pct(inCount, possible - leave) };
    });
    return {
      columns: [{ key: "Department", header: "Department" }, { key: "Staff", header: "Staff", kind: "num" }, { key: "Person-days", header: "Person-days", kind: "num" }, { key: "Present", header: "Present", kind: "num" }, { key: "Late", header: "Late", kind: "num" }, { key: "Leave days", header: "Leave days", kind: "num" }, { key: "Attendance %", header: "Attendance", kind: "pct" }],
      rows,
      chart: { type: "bars", title: "Attendance rate by department", data: rows, x: "Department", y: "Attendance %", horizontal: true, format: "pct" },
      note: "Person-days are working days for each person after they joined, up to yesterday.",
    };
  },

  async hours(c) {
    const { emps } = await attendanceGrid(c);
    const rows = emps.map((e) => {
      const worked = e.attendance.filter((a) => a.minutesWorked > 0);
      const total = worked.reduce((s, a) => s + a.minutesWorked, 0);
      const overtime = worked.reduce((s, a) => s + Math.max(0, a.minutesWorked - 8 * 60), 0);
      return { Employee: e.name, Department: e.department.name, "Days worked": worked.length, "Total hours": hours(total), "Avg per day": worked.length ? hours(total / worked.length) : 0, "Overtime hours": hours(overtime) };
    });
    return {
      columns: [{ key: "Employee", header: "Employee" }, { key: "Department", header: "Department" }, { key: "Days worked", header: "Days worked", kind: "num" }, { key: "Total hours", header: "Total hours", kind: "num" }, { key: "Avg per day", header: "Avg per day", kind: "num" }, { key: "Overtime hours", header: "Overtime hours", kind: "num" }],
      rows,
      chart: { type: "bars", title: "Most hours worked (top 10)", data: [...rows].sort((a, b) => Number(b["Total hours"]) - Number(a["Total hours"])).slice(0, 10), x: "Employee", y: "Total hours", horizontal: true },
      note: "Hours come from punch-in to punch-out. Overtime is time beyond 8 hours in a day.",
    };
  },

  async perf(c) {
    const emps = await db.employee.findMany({
      where: { ...c.empScope, status: { not: "INACTIVE" } },
      orderBy: { name: "asc" },
      select: {
        name: true,
        designation: true,
        department: { select: { name: true } },
        goals: { select: { progress: true } },
        reviewsGot: { orderBy: { createdAt: "desc" }, take: 1, select: { rating: true, period: true } },
      },
    });
    const rows = emps.map((e) => ({
      Employee: e.name,
      Department: e.department.name,
      Designation: e.designation,
      Goals: e.goals.length,
      "Goal progress %": e.goals.length ? Math.round(e.goals.reduce((s, g) => s + g.progress, 0) / e.goals.length) : 0,
      "Latest rating": e.reviewsGot[0] ? `${e.reviewsGot[0].rating.toFixed(1)} / 5` : "—",
      "Review period": e.reviewsGot[0]?.period ?? "—",
    }));
    return {
      columns: [{ key: "Employee", header: "Employee" }, { key: "Department", header: "Department" }, { key: "Designation", header: "Designation" }, { key: "Goals", header: "Goals", kind: "num" }, { key: "Goal progress %", header: "Goal progress", kind: "pct" }, { key: "Latest rating", header: "Latest rating" }, { key: "Review period", header: "Review period" }],
      rows,
      chart: { type: "bars", title: "Highest goal progress (top 10)", data: [...rows].sort((a, b) => Number(b["Goal progress %"]) - Number(a["Goal progress %"])).slice(0, 10), x: "Employee", y: "Goal progress %", horizontal: true, format: "pct" },
      note: "Current goals and each person's most recent review. The date range does not apply to this report.",
    };
  },

  async payroll(c) {
    const slips = await db.payslip.findMany({
      where: { published: true, employee: c.empScope, month: { gte: dbDate(`${c.from.slice(0, 7)}-01`), lte: dbDate(`${c.to.slice(0, 7)}-01`) } },
      select: { month: true, basic: true, house: true, transport: true, medical: true, tax: true, providentFund: true, other: true, net: true, employee: { select: { department: { select: { name: true } } } } },
    });
    const by = new Map<string, { Department: string; Slips: number; Gross: number; Tax: number; "Provident fund": number; Net: number }>();
    for (const s of slips) {
      const k = s.employee.department.name;
      const r = by.get(k) ?? { Department: k, Slips: 0, Gross: 0, Tax: 0, "Provident fund": 0, Net: 0 };
      r.Slips++;
      r.Gross += s.basic + s.house + s.transport + s.medical;
      r.Tax += s.tax;
      r["Provident fund"] += s.providentFund;
      r.Net += s.net;
      by.set(k, r);
    }
    const rows = [...by.values()].sort((a, b) => b.Net - a.Net);
    const months = [...new Set(slips.map((s) => isoOf(s.month).slice(0, 7)))].sort();
    return {
      columns: [{ key: "Department", header: "Department" }, { key: "Slips", header: "Slips", kind: "num" }, { key: "Gross", header: "Gross", kind: "money" }, { key: "Tax", header: "Tax", kind: "money" }, { key: "Provident fund", header: "Provident fund", kind: "money" }, { key: "Net", header: "Net pay", kind: "money" }],
      rows,
      chart: rows.length ? { type: "bars", title: "Net pay by department", data: rows, x: "Department", y: "Net", horizontal: true, format: "pkr" } : null,
      note: months.length ? `Published payroll for ${months.map(monthLabel).join(", ")}.` : "No published payroll in this date range.",
    };
  },

  "t-open": (c) => ticketReport(c, "OPEN"),
  "t-pending": (c) => ticketReport(c, "PENDING"),
  "t-closed": (c) => ticketReport(c, "CLOSED"),
};

async function ticketReport(c: Ctx, status: "OPEN" | "PENDING" | "CLOSED"): Promise<Body> {
  const deptFilter: Prisma.TicketWhereInput = c.dept === "All" ? {} : { OR: [{ department: c.dept }, { forwardedTo: c.dept }] };
  const tickets = await db.ticket.findMany({
    where: { status, createdAt: { gte: new Date(`${c.from}T00:00:00+05:00`), lt: new Date(`${addDays(c.to, 1)}T00:00:00+05:00`) }, ...deptFilter },
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, department: true, forwardedTo: true, createdAt: true, latestUpdate: true, resolution: true, status: true, submittedBy: { select: { name: true } } },
  });
  const rows = tickets.map((t) => ({
    "Ticket ID": t.id,
    Subject: t.subject,
    "Raised by": t.submittedBy.name,
    From: t.department,
    "Forwarded to": t.forwardedTo ?? "—",
    Submitted: localDate(t.createdAt),
    [status === "CLOSED" ? "Resolution" : "Latest update"]: status === "CLOSED" ? (t.resolution ?? "—") : t.latestUpdate,
    Status: ticketLabel[t.status],
  }));
  const groupKey = status === "OPEN" ? "From" : "Forwarded to";
  return {
    columns: [{ key: "Ticket ID", header: "Ticket ID" }, { key: "Subject", header: "Subject" }, { key: "Raised by", header: "Raised by" }, { key: "From", header: "From" }, { key: "Forwarded to", header: "Forwarded to" }, { key: "Submitted", header: "Submitted" }, status === "CLOSED" ? { key: "Resolution", header: "Resolution" } : { key: "Latest update", header: "Latest update" }, { key: "Status", header: "Status", kind: "status" }],
    rows,
    chart: rows.length ? { type: "bars", title: status === "OPEN" ? "Raised by department" : "By department handling it", data: countBy(rows, groupKey), x: groupKey, y: "count" } : null,
    note: c.dept === "All" ? "Tickets submitted in the date range." : `Tickets submitted in the date range that ${c.dept} raised or is handling.`,
  };
}
