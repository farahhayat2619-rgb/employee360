import { CalendarDays, CheckCircle2, Clock, Hourglass, Megaphone, PartyPopper, Ticket } from "lucide-react";
import Link from "next/link";
import { MiniCalendar } from "@/components/mini-calendar";
import { PunchCard } from "@/components/punch-card";
import { Badge, Card, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { announcements, currentUsers, employeeById, formatDate, holidays, leaveTypes, myAttendance, ticketCounts, tickets, tasks } from "@/lib/sample-data";

export default function EmployeeDashboard() {
  const me = employeeById(currentUsers.employee);
  const worked = myAttendance.filter((a) => a.status === "Present" || a.status === "Late");
  const late = myAttendance.filter((a) => a.status === "Late").length;
  const leaveDays = myAttendance.filter((a) => a.status === "On leave").length;
  const hours = worked.reduce((s, a) => s + a.hours, 0);
  const balance = leaveTypes.reduce((s, l) => s + l.allowed - l.used, 0);
  const myTasks = tasks.filter((t) => t.assignee === me.id && t.status !== "Completed");
  const myTickets = ticketCounts(tickets.filter((t) => t.employeeId === me.id));
  const firstName = me.name.split(" ")[0];

  return (
    <>
      <PageHeader title={`Good morning, ${firstName}`} subtitle={`${me.id} · ${me.designation} · ${me.department}`} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <PunchCard />
        </div>
        <Card title="Leave balance" action={<Link href="/employee/leave" className="text-xs font-medium text-accent-700 hover:underline">Apply</Link>}>
          <p className="text-3xl font-semibold text-navy-900 tabular-nums">
            {balance} <span className="text-base font-normal text-ink-soft">days left</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {leaveTypes.map((l) => (
              <li key={l.type} className="flex justify-between">
                <span className="text-ink-soft">{l.type}</span>
                <span className="font-medium tabular-nums">
                  {l.allowed - l.used} / {l.allowed}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Days present (Oct)" value={worked.length} hint={`${leaveDays} on leave`} icon={CheckCircle2} tone="good" />
        <StatCard label="Late arrivals (Oct)" value={late} hint="15 min grace" icon={Hourglass} tone="warn" />
        <StatCard label="Hours worked (Oct)" value={hours.toFixed(1)} hint={`Avg ${(hours / worked.length).toFixed(1)} h/day`} icon={Clock} tone="blue" />
        <StatCard
          label="My tickets"
          value={
            <span className="flex gap-3 text-lg">
              <span title="Open">{myTickets.open} <span className="text-xs font-normal text-ink-faint">open</span></span>
              <span title="Pending">{myTickets.pending} <span className="text-xs font-normal text-ink-faint">pending</span></span>
              <span title="Closed">{myTickets.closed} <span className="text-xs font-normal text-ink-faint">closed</span></span>
            </span>
          }
          icon={Ticket}
          tone="navy"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Pending tasks" action={<Link href="/employee/tasks" className="text-xs font-medium text-accent-700 hover:underline">View all</Link>} className="lg:col-span-2" pad={false}>
          <ul className="divide-y divide-line">
            {myTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-900">{t.title}</p>
                  <p className="text-xs text-ink-faint">Due {formatDate(t.deadline)} · {t.assignedBy}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {t.priority === "High" && <Badge tone="bad">High</Badge>}
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={<span className="flex items-center gap-2"><PartyPopper className="size-4 text-accent-600" /> Upcoming holidays</span>} pad={false}>
          <ul className="divide-y divide-line">
            {holidays.map((h) => (
              <li key={h.date} className="flex items-center gap-3 px-5 py-3">
                <span className="grid w-11 shrink-0 rounded-lg bg-accent-50 py-1 text-center">
                  <span className="text-[10px] font-semibold text-accent-700 uppercase">{formatDate(h.date, { month: "short" })}</span>
                  <span className="text-base leading-tight font-semibold text-navy-900">{formatDate(h.date, { day: "numeric" })}</span>
                </span>
                <span className="text-sm">
                  <span className="block font-medium text-navy-900">{h.name}</span>
                  <span className="text-xs text-ink-faint">{formatDate(h.date, { weekday: "long" })}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title={<span className="flex items-center gap-2"><Megaphone className="size-4 text-accent-600" /> Latest announcements</span>} className="lg:col-span-2" pad={false}>
          <ul className="divide-y divide-line">
            {announcements.slice(0, 3).map((a) => (
              <li key={a.id} className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Badge tone={a.type === "Important" ? "bad" : a.type === "Holiday" ? "good" : "blue"}>{a.type}</Badge>
                  <span className="text-xs text-ink-faint">{formatDate(a.date)}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-navy-900">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{a.body}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={<span className="flex items-center gap-2"><CalendarDays className="size-4 text-accent-600" /> October at a glance</span>}>
          <MiniCalendar />
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-soft">
            <Legend className="bg-good" label="Present" />
            <Legend className="bg-warn" label="Late" />
            <Legend className="bg-accent-500" label="Leave" />
            <Legend className="bg-line" label="Weekend" />
          </div>
        </Card>
      </div>
    </>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${className}`} /> {label}
    </span>
  );
}
