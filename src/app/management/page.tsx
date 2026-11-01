import { Ticket, UserCheck, Users, UserX } from "lucide-react";
import Link from "next/link";
import { Bars, TrendLine } from "@/components/charts";
import { Avatar, Card, PageHeader, Progress, StatCard, StatusBadge } from "@/components/ui";
import { attendanceTrend, departments, employeeById, employees, formatDate, goals, leaveRequests, tickets } from "@/lib/sample-data";

export default function ManagementDashboard() {
  const team = employees.filter((e) => e.department === "Operations");
  const present = team.filter((e) => e.todayStatus === "Present").length;
  const late = team.filter((e) => e.todayStatus === "Late").length;
  const away = team.filter((e) => e.todayStatus === "Absent" || e.todayStatus === "On leave").length;
  const pendingLeave = leaveRequests.filter((l) => (l.status === "Pending" || l.status === "Cancel requested") && employeeById(l.employeeId).department === "Operations");
  const newTickets = tickets.filter((t) => t.status === "Open");
  const teamGoals = goals.filter((g) => team.some((e) => e.id === g.employeeId));
  const goalAvg = Math.round(teamGoals.reduce((s, g) => s + g.progress, 0) / teamGoals.length);

  return (
    <>
      <PageHeader title="Management Dashboard" subtitle="Operations department · Monday 2 November 2026" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team size" value={team.length} hint={`${employees.length} shown company-wide`} icon={Users} tone="navy" />
        <StatCard label="In today" value={present + late} hint={`${late} late`} icon={UserCheck} tone="good" />
        <StatCard label="Away today" value={away} hint="Absent or on leave" icon={UserX} tone="warn" />
        <StatCard label="Tickets to review" value={newTickets.length} hint="Waiting to be forwarded" icon={Ticket} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Leave requests waiting" action={<Link href="/management/leave" className="text-xs font-medium text-accent-700 hover:underline">Review all</Link>} pad={false}>
          <ul className="divide-y divide-line">
            {pendingLeave.map((l) => {
              const e = employeeById(l.employeeId);
              return (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={e.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">{e.name}</p>
                    <p className="text-xs text-ink-faint">{l.type} · {l.days} day{l.days > 1 ? "s" : ""} from {formatDate(l.from, { day: "numeric", month: "short" })}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="New complaint tickets" action={<Link href="/management/tickets" className="text-xs font-medium text-accent-700 hover:underline">Open review</Link>} pad={false}>
          <ul className="divide-y divide-line">
            {newTickets.map((t) => (
              <li key={t.id} className="px-5 py-3">
                <p className="text-sm font-medium text-navy-900">{t.subject}</p>
                <p className="text-xs text-ink-faint">{t.id} · {t.submittedBy}, {t.department}</p>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3 text-xs text-ink-soft">
            {tickets.filter((t) => t.status === "Pending").length} pending with departments · {tickets.filter((t) => t.status === "Closed").length} closed
          </div>
        </Card>

        <Card title="Team goal progress">
          <p className="text-3xl font-semibold text-navy-900">{goalAvg}%</p>
          <p className="text-xs text-ink-faint">Average across {teamGoals.length} active goals</p>
          <ul className="mt-4 space-y-3">
            {teamGoals.slice(0, 4).map((g) => (
              <li key={g.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="truncate pr-2 text-ink-soft">{g.title}</span>
                  <span className="font-medium tabular-nums">{g.progress}%</span>
                </div>
                <Progress value={g.progress} tone={g.progress === 100 ? "good" : "blue"} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Company attendance rate · October">
          <TrendLine data={attendanceTrend} x="day" y="rate" unit="%" domain={[85, 100]} />
        </Card>
        <Card title="Attendance by department">
          <Bars data={departments.map((d) => ({ dept: d.name, rate: d.attendanceRate }))} x="dept" y="rate" horizontal format="pct" />
        </Card>
      </div>
      <p className="mt-4 text-xs text-ink-faint">Figures update from live data once the database is connected in Phase 2.</p>
    </>
  );
}
