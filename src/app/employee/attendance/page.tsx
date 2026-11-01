import { CalendarCheck, Clock, Hourglass, LogOut } from "lucide-react";
import { Tabs } from "@/components/client-ui";
import { MiniCalendar } from "@/components/mini-calendar";
import { PunchCard } from "@/components/punch-card";
import { Badge, Card, DataTable, PageHeader, StatCard, StatusBadge, type Column } from "@/components/ui";
import { formatDate, myAttendance, type AttendanceRow } from "@/lib/sample-data";

const history = [
  { month: "October 2026", present: 20, late: 3, early: 2, leave: 2, absent: 0, hours: 171.4 },
  { month: "September 2026", present: 21, late: 1, early: 0, leave: 1, absent: 0, hours: 178.9 },
  { month: "August 2026", present: 20, late: 2, early: 1, leave: 1, absent: 0, hours: 169.2 },
  { month: "July 2026", present: 23, late: 0, early: 1, leave: 0, absent: 0, hours: 194.6 },
];

export default function AttendancePage() {
  const workdays = myAttendance.filter((a) => a.status !== "Weekend");
  const worked = workdays.filter((a) => a.in);
  const late = workdays.filter((a) => a.status === "Late");
  const early = workdays.filter((a) => a.early);
  const hours = worked.reduce((s, a) => s + a.hours, 0);

  const cols: Column<AttendanceRow>[] = [
    { key: "date", header: "Date", cell: (a) => <span className="font-medium whitespace-nowrap text-navy-900">{formatDate(a.date, { weekday: "short", day: "numeric", month: "short" })}</span> },
    { key: "in", header: "Punch in", cell: (a) => a.in ?? "—", className: "tabular-nums" },
    { key: "out", header: "Punch out", cell: (a) => a.out ?? "—", className: "tabular-nums" },
    { key: "hours", header: "Hours", cell: (a) => (a.hours ? `${a.hours.toFixed(1)} h` : "—"), className: "tabular-nums" },
    { key: "loc", header: "Location", cell: (a) => (a.location ? <span className="whitespace-nowrap text-ink-soft">{a.location}</span> : "—") },
    { key: "status", header: "Status", cell: (a) => <span className="flex gap-1.5"><StatusBadge status={a.status} />{a.early && <Badge tone="warn">Early out</Badge>}<Badge tone="grey">Demo</Badge></span> },
  ];

  return (
    <>
      <PageHeader title="Attendance" subtitle="Punch in and out from inside the office. Your location is checked every time." />
      <PunchCard />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Days present" value={worked.length} hint={`of ${workdays.length} working days`} icon={CalendarCheck} tone="good" />
        <StatCard label="Late arrivals" value={late.length} hint="after 09:15" icon={Hourglass} tone="warn" />
        <StatCard label="Early departures" value={early.length} hint="before 17:00" icon={LogOut} tone="bad" />
        <StatCard label="Total hours" value={hours.toFixed(1)} hint="October 2026" icon={Clock} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Attendance calendar · October 2026">
          <MiniCalendar />
        </Card>
        <div className="min-w-0 lg:col-span-2">
          <Tabs
            tabs={[
              { id: "daily", label: "Daily records", content: <Card pad={false}><DataTable rows={workdays} rowKey={(a) => a.date} columns={cols} /></Card> },
              { id: "late", label: `Late arrivals (${late.length})`, content: <Card pad={false}><DataTable rows={late} rowKey={(a) => a.date} columns={cols} /></Card> },
              { id: "early", label: `Early departures (${early.length})`, content: <Card pad={false}><DataTable rows={early} rowKey={(a) => a.date} columns={cols} /></Card> },
              {
                id: "monthly",
                label: "Monthly history",
                content: (
                  <Card pad={false}>
                    <DataTable
                      rows={history}
                      rowKey={(h) => h.month}
                      columns={[
                        { key: "m", header: "Month", cell: (h) => <span className="font-medium text-navy-900">{h.month}</span> },
                        { key: "p", header: "Present", cell: (h) => h.present },
                        { key: "l", header: "Late", cell: (h) => h.late },
                        { key: "e", header: "Early out", cell: (h) => h.early },
                        { key: "lv", header: "Leave", cell: (h) => h.leave },
                        { key: "a", header: "Absent", cell: (h) => h.absent },
                        { key: "h", header: "Hours", cell: (h) => h.hours.toFixed(1) },
                      ]}
                    />
                  </Card>
                ),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
