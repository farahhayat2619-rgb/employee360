import { CalendarCheck, Clock, Hourglass, LogOut } from "lucide-react";
import { dayColumns, MonthNav } from "@/components/attendance-parts";
import { Tabs } from "@/components/client-ui";
import { CalendarLegend, MiniCalendar } from "@/components/mini-calendar";
import { PunchCard } from "@/components/punch-card";
import { Card, DataTable, PageHeader, StatCard } from "@/components/ui";
import { myAttendance, myPunchCard } from "@/lib/attendance";
import { monthLabel } from "@/lib/time";

export default async function AttendancePage(props: PageProps<"/employee/attendance">) {
  const { month: monthParam } = (await props.searchParams) as { month?: string };
  const [{ today, office }, data] = await Promise.all([myPunchCard(), myAttendance(monthParam)]);
  const { month, days, summary: s, history } = data;
  const workdays = days.filter((d) => d.status !== "Weekend" && d.status !== "Holiday");
  const late = workdays.filter((a) => a.status === "Late");
  const early = workdays.filter((a) => a.early);
  const label = monthLabel(month);

  return (
    <>
      <PageHeader title="Attendance" subtitle="Punch in and out from inside the office. Your location is checked every time." />
      <PunchCard today={today} office={office} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Days present" value={s.present} hint={`of ${s.workdays} working days · ${label}`} icon={CalendarCheck} tone="good" />
        <StatCard label="Late arrivals" value={s.late} hint={`after ${office.workStart} + ${office.graceMin} min`} icon={Hourglass} tone="warn" />
        <StatCard label="Early departures" value={s.early} hint={`before ${office.workEnd}`} icon={LogOut} tone="bad" />
        <StatCard label="Total hours" value={s.hours.toFixed(1)} hint={label} icon={Clock} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Attendance calendar" action={<MonthNav month={month} prev={data.prevMonth} next={data.nextMonth} basePath="/employee/attendance" />}>
          <MiniCalendar month={month} days={[...days].reverse()} />
          <CalendarLegend />
        </Card>
        <div className="min-w-0 lg:col-span-2">
          <Tabs
            tabs={[
              { id: "daily", label: "Daily records", content: <Card pad={false}><DataTable rows={workdays} rowKey={(a) => a.date} columns={dayColumns} empty={`No working days recorded in ${label} yet.`} /></Card> },
              { id: "late", label: `Late arrivals (${late.length})`, content: <Card pad={false}><DataTable rows={late} rowKey={(a) => a.date} columns={dayColumns} empty="No late arrivals this month." /></Card> },
              { id: "early", label: `Early departures (${early.length})`, content: <Card pad={false}><DataTable rows={early} rowKey={(a) => a.date} columns={dayColumns} empty="No early departures this month." /></Card> },
              {
                id: "monthly",
                label: "Monthly history",
                content: (
                  <Card pad={false}>
                    <DataTable
                      rows={history}
                      rowKey={(h) => h.month}
                      columns={[
                        { key: "m", header: "Month", cell: (h) => <span className="font-medium whitespace-nowrap text-navy-900">{monthLabel(h.month)}</span> },
                        { key: "p", header: "Present", cell: (h) => `${h.present} / ${h.workdays}` },
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
