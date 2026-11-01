import { CalendarDays, Ticket, UserCheck, Users, UserX } from "lucide-react";
import Link from "next/link";
import { Bars, TrendLine } from "@/components/charts";
import { Avatar, Card, PageHeader, Progress, StatCard, StatusBadge } from "@/components/ui";
import { managementDashboard } from "@/lib/dashboards";
import { formatDate } from "@/lib/sample-data";

const linkClass = "text-xs font-medium text-accent-700 hover:underline";
const emptyRow = (text: string) => <li className="px-5 py-6 text-center text-sm text-ink-faint">{text}</li>;

export default async function ManagementDashboard() {
  const d = await managementDashboard();
  const inToday = d.today.present + d.today.late;

  return (
    <>
      <PageHeader title="Management Dashboard" subtitle={`${d.department} department · ${d.dateLabel}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team size" value={d.teamSize} hint={`Active staff in ${d.department}`} icon={Users} tone="navy" />
        <StatCard label="In today" value={d.offDay ? "—" : inToday} hint={d.offDay ? `${d.offDay}, no attendance expected` : `${d.today.late} late`} icon={UserCheck} tone="good" />
        <StatCard label="Away today" value={d.offDay ? "—" : d.today.absent + d.today.onLeave} hint={d.offDay ? d.offDay : `${d.today.onLeave} on leave · ${d.today.absent} not in yet`} icon={UserX} tone="warn" />
        <StatCard label="Tickets to review" value={d.tickets.open} hint="Waiting to be forwarded" icon={Ticket} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Leave requests waiting" action={<Link href="/management/leave" className={linkClass}>Review all</Link>} pad={false}>
          <ul className="divide-y divide-line">
            {d.pendingLeave.length === 0 && emptyRow("No leave requests waiting.")}
            {d.pendingLeave.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={l.employee} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">{l.employee}</p>
                  <p className="text-xs text-ink-faint">
                    {l.type} · {l.days} day{l.days > 1 ? "s" : ""} from {formatDate(l.from, { day: "numeric", month: "short" })}
                  </p>
                </div>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="New complaint tickets" action={<Link href="/management/tickets" className={linkClass}>Open review</Link>} pad={false}>
          <ul className="divide-y divide-line">
            {d.newTickets.length === 0 && emptyRow("No new complaints to review.")}
            {d.newTickets.map((t) => (
              <li key={t.id} className="px-5 py-3">
                <p className="text-sm font-medium text-navy-900">{t.subject}</p>
                <p className="text-xs text-ink-faint">
                  {t.id} · {t.by}, {t.department}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3 text-xs text-ink-soft">
            {d.tickets.pending} pending with departments · {d.tickets.closed} closed
          </div>
        </Card>

        <Card title="Team goal progress" action={<Link href="/management/performance" className={linkClass}>Details</Link>}>
          {d.goalAvg === null ? (
            <p className="py-6 text-center text-sm text-ink-faint">No goals set for your team yet.</p>
          ) : (
            <>
              <p className="text-3xl font-semibold text-navy-900">{d.goalAvg}%</p>
              <p className="text-xs text-ink-faint">Average goal progress across your team</p>
              <ul className="mt-4 space-y-3">
                {d.goalPeople.map((p) => (
                  <li key={p.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate pr-2 text-ink-soft">{p.name}</span>
                      <span className="font-medium tabular-nums">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} tone={p.progress === 100 ? "good" : "blue"} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><CalendarDays className="size-4 text-accent-600" /> {d.department} attendance rate · {d.trendMonth}</span>}>
          {d.trend.length ? <TrendLine data={d.trend} x="day" y="rate" unit="%" domain={[0, 100]} /> : <p className="py-16 text-center text-sm text-ink-faint">No attendance recorded yet.</p>}
        </Card>
        <Card title="Attendance by department · October">
          <Bars data={d.deptRates} x="dept" y="rate" horizontal format="pct" />
        </Card>
      </div>
    </>
  );
}
