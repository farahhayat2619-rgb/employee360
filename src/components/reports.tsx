"use client";

import clsx from "clsx";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { attendanceTrend, departments, employees, formatPKR, leaveByType, leaveRequests, payrollByDept, tickets, type Employee } from "@/lib/sample-data";
import { Bars, Donut, TrendLine } from "./charts";
import { Filters } from "./people";
import { buttonClass, Card, DataTable, StatusBadge, type Column } from "./ui";

type Row = Record<string, string | number>;
type Report = { id: string; name: string; chart: (rows: Row[]) => React.ReactNode; rows: (emps: Employee[]) => Row[]; columns: { key: string; header: string; money?: boolean }[] };

// Deterministic demo figures per employee
const seedNum = (id: string, mod: number) => Number(id.slice(-2)) % mod;

const reports: Report[] = [
  {
    id: "daily",
    name: "Daily Attendance",
    rows: (es) => es.map((e) => ({ Employee: e.name, ID: e.id, Department: e.department, "Punch in": e.todayStatus === "Late" ? "09:31" : e.todayStatus === "Present" ? "08:52" : "—", Status: e.todayStatus })),
    columns: [{ key: "Employee", header: "Employee" }, { key: "ID", header: "ID" }, { key: "Department", header: "Department" }, { key: "Punch in", header: "Punch in" }, { key: "Status", header: "Status" }],
    chart: (rows) => <Bars data={["Present", "Late", "Absent", "On leave"].map((s) => ({ status: s, count: rows.filter((r) => r.Status === s).length }))} x="status" y="count" />,
  },
  {
    id: "monthly",
    name: "Monthly Attendance",
    rows: (es) => es.map((e) => ({ Employee: e.name, Department: e.department, Present: 18 + seedNum(e.id, 4), Late: seedNum(e.id, 4), Absent: seedNum(e.id, 7) === 0 ? 1 : 0, Leave: seedNum(e.id, 3) })),
    columns: [{ key: "Employee", header: "Employee" }, { key: "Department", header: "Department" }, { key: "Present", header: "Present" }, { key: "Late", header: "Late" }, { key: "Absent", header: "Absent" }, { key: "Leave", header: "Leave" }],
    chart: () => <TrendLine data={attendanceTrend} x="day" y="rate" unit="%" domain={[85, 100]} />,
  },
  {
    id: "leave",
    name: "Employee Leave",
    rows: (es) => leaveRequests.filter((l) => es.some((e) => e.id === l.employeeId)).map((l) => ({ Employee: employees.find((e) => e.id === l.employeeId)!.name, Type: l.type, From: l.from, To: l.to, Days: l.days, Status: l.status })),
    columns: [{ key: "Employee", header: "Employee" }, { key: "Type", header: "Type" }, { key: "From", header: "From" }, { key: "To", header: "To" }, { key: "Days", header: "Days" }, { key: "Status", header: "Status" }],
    chart: () => <Donut data={leaveByType} name="type" value="days" />,
  },
  {
    id: "dept",
    name: "Department-wise Attendance",
    rows: () => departments.map((d) => ({ Department: d.name, Head: d.head, Staff: d.headcount, "Attendance %": d.attendanceRate })),
    columns: [{ key: "Department", header: "Department" }, { key: "Head", header: "Head" }, { key: "Staff", header: "Staff" }, { key: "Attendance %", header: "Attendance %" }],
    chart: (rows) => <Bars data={rows} x="Department" y="Attendance %" horizontal format="pct" />,
  },
  {
    id: "hours",
    name: "Working Hours",
    rows: (es) => es.map((e) => ({ Employee: e.name, Department: e.department, "Total hours": 160 + seedNum(e.id, 25), "Avg per day": (7.6 + seedNum(e.id, 9) / 10).toFixed(1), Overtime: seedNum(e.id, 6) })),
    columns: [{ key: "Employee", header: "Employee" }, { key: "Department", header: "Department" }, { key: "Total hours", header: "Total hours" }, { key: "Avg per day", header: "Avg per day" }, { key: "Overtime", header: "Overtime h" }],
    chart: (rows) => <Bars data={rows.slice(0, 10)} x="Employee" y="Total hours" horizontal />,
  },
  {
    id: "perf",
    name: "Employee Performance",
    rows: (es) => es.map((e) => ({ Employee: e.name, Department: e.department, Designation: e.designation, "KPI score": e.performance })),
    columns: [{ key: "Employee", header: "Employee" }, { key: "Department", header: "Department" }, { key: "Designation", header: "Designation" }, { key: "KPI score", header: "KPI score" }],
    chart: (rows) => <Bars data={[...rows].sort((a, b) => Number(b["KPI score"]) - Number(a["KPI score"])).slice(0, 10)} x="Employee" y="KPI score" horizontal />,
  },
  {
    id: "payroll",
    name: "Payroll Summary",
    rows: () => payrollByDept.map((p) => ({ Department: p.dept, "Net pay (PKR)": p.net, Gross: Math.round(p.net * 1.14), Deductions: Math.round(p.net * 0.14) })),
    columns: [{ key: "Department", header: "Department" }, { key: "Gross", header: "Gross", money: true }, { key: "Deductions", header: "Deductions", money: true }, { key: "Net pay (PKR)", header: "Net pay", money: true }],
    chart: (rows) => <Bars data={rows} x="Department" y="Net pay (PKR)" horizontal format="pkr" />,
  },
  ...(["Open", "Pending", "Closed"] as const).map(
    (status): Report => ({
      id: `t-${status.toLowerCase()}`,
      name: `${status} Tickets`,
      rows: (es) => tickets.filter((t) => t.status === status && es.some((e) => e.id === t.employeeId)).map((t) => ({ "Ticket ID": t.id, Subject: t.subject, From: t.department, "Forwarded to": t.forwardedTo ?? "—", Submitted: t.submitted, Status: t.status })),
      columns: [{ key: "Ticket ID", header: "Ticket ID" }, { key: "Subject", header: "Subject" }, { key: "From", header: "From" }, { key: "Forwarded to", header: "Forwarded to" }, { key: "Submitted", header: "Submitted" }, { key: "Status", header: "Status" }],
      chart: (rows) => {
        const by: Record<string, number> = {};
        rows.forEach((r) => (by[String(status === "Open" ? r.From : r["Forwarded to"])] = (by[String(status === "Open" ? r.From : r["Forwarded to"])] ?? 0) + 1));
        return <Bars data={Object.entries(by).map(([dept, count]) => ({ dept, count }))} x="dept" y="count" />;
      },
    }),
  ),
];

function toCsv(rows: Row[], cols: Report["columns"]) {
  const esc = (v: unknown) => `"${String(v).replaceAll('"', '""')}"`;
  return [cols.map((c) => esc(c.header)).join(","), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(","))].join("\n");
}

export function ReportsView({ scopeDept }: { scopeDept?: string }) {
  const [id, setId] = useState(reports[0].id);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState(scopeDept ?? "All");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-31");
  const report = reports.find((r) => r.id === id)!;

  const rows = useMemo(() => {
    const es = employees.filter((e) => dept === "All" || e.department === dept);
    return report.rows(es).filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase())));
  }, [report, dept, q]);

  const columns: Column<Row>[] = report.columns.map((c) => ({
    key: c.key,
    header: c.header,
    cell: (r) => (c.key === "Status" ? <StatusBadge status={String(r[c.key])} /> : c.money ? formatPKR(Number(r[c.key])) : r[c.key]),
    className: c.money ? "text-right tabular-nums" : undefined,
  }));

  function download() {
    const blob = new Blob([toCsv(rows, report.columns)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.name.toLowerCase().replaceAll(" ", "-")}-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Reports">
        {reports.map((r) => (
          <button key={r.id} onClick={() => setId(r.id)} className={clsx("rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition-colors", r.id === id ? "bg-navy-900 font-medium text-white" : "text-ink-soft hover:bg-surface hover:text-navy-900")}>
            {r.name}
          </button>
        ))}
      </nav>
      <div className="min-w-0 space-y-6">
        <Card
          title={`${report.name} report`}
          action={
            <span className="flex gap-2">
              <button className={buttonClass("outline", "sm")} onClick={download}>
                <Download className="size-3.5" /> CSV
              </button>
              <button className={buttonClass("outline", "sm")} onClick={() => window.print()}>
                <Printer className="size-3.5" /> PDF
              </button>
            </span>
          }
          pad={false}
        >
          <Filters
            q={q}
            setQ={setQ}
            dept={dept}
            setDept={scopeDept ? undefined : setDept}
            extra={
              <span className="flex items-center gap-2 text-sm">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-line px-2 py-1.5" aria-label="From date" />
                <span className="text-ink-faint">to</span>
                <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-line px-2 py-1.5" aria-label="To date" />
              </span>
            }
          />
          <div className="p-5">{report.chart(rows)}</div>
        </Card>
        <Card pad={false}>
          <DataTable rows={rows} rowKey={(r) => JSON.stringify(r)} columns={columns} empty="No records for these filters." />
        </Card>
      </div>
    </div>
  );
}
