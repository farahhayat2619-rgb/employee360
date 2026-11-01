import { Building2, CalendarDays, Headset, UserCheck, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { Bars, Donut, TrendLine } from "@/components/charts";
import { buttonClass, Card, PageHeader, StatCard } from "@/components/ui";
import { adminDashboard } from "@/lib/dashboards";
import { formatPKR } from "@/lib/sample-data";

export default async function AdminDashboard() {
  const d = await adminDashboard();
  const ticketData = [
    { status: "Open", count: d.tickets.open },
    { status: "Pending", count: d.tickets.pending },
    { status: "Closed", count: d.tickets.closed },
  ];
  const today = [
    { s: "Present", n: d.today.present },
    { s: "Late", n: d.today.late },
    { s: "Absent / not in", n: d.today.absent },
    { s: "On leave", n: d.today.onLeave },
  ];

  return (
    <>
      <PageHeader
        title="HR Dashboard"
        subtitle={`Crescent Bank · ${d.dateLabel}`}
        actions={
          <>
            <Link href="/admin/employees/new" className={buttonClass("primary")}>
              Register employee
            </Link>
            <Link href="/admin/reports" className={buttonClass("outline")}>
              Reports
            </Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total employees" value={d.total} icon={Users} tone="navy" />
        <StatCard label="Active" value={d.active} hint={`${d.inactive} inactive`} icon={UserCheck} tone="good" />
        <StatCard label="Departments" value={d.departments} icon={Building2} tone="navy" />
        <StatCard label="Leave pending" value={d.pendingLeave} icon={CalendarDays} tone="warn" />
        <StatCard label="Helpdesk open" value={d.helpdeskOpen} icon={Headset} tone="blue" />
        <StatCard
          label={d.payroll ? `Payroll · ${d.payroll.month}` : "Payroll"}
          value={<span className="text-lg">{d.payroll ? formatPKR(d.payroll.net) : "Not run yet"}</span>}
          hint={d.payroll ? "Published net pay" : undefined}
          icon={Wallet}
          tone="good"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Today's attendance">
          {d.offDay ? (
            <p className="rounded-lg bg-navy-50 p-4 text-sm text-ink-soft">{d.offDay} today, so no attendance is expected.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {today.map((t) => (
                <div key={t.s} className="rounded-lg bg-navy-50 p-3">
                  <p className="text-xs text-ink-faint">{t.s}</p>
                  <p className="text-2xl font-semibold text-navy-900">{t.n}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/attendance" className="mt-4 inline-block text-xs font-medium text-accent-700 hover:underline">
            Open attendance monitor
          </Link>
        </Card>
        <Card title={`Attendance rate · ${d.trendMonth}`} className="xl:col-span-2">
          {d.trend.length ? <TrendLine data={d.trend} x="day" y="rate" unit="%" domain={[0, 100]} /> : <p className="py-16 text-center text-sm text-ink-faint">No attendance recorded yet.</p>}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={d.payroll ? `Net payroll by department · ${d.payroll.month}` : "Net payroll by department"}>
          {d.payroll ? <Bars data={d.payroll.byDept} x="dept" y="net" horizontal format="pkr" /> : <p className="py-16 text-center text-sm text-ink-faint">Publish a payroll month to see this chart.</p>}
        </Card>
        <Card title="Complaint tickets by status" action={<span className="text-xs text-ink-faint">{d.tickets.open + d.tickets.pending + d.tickets.closed} in total</span>}>
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <Donut data={ticketData} name="status" value="count" />
            <ul className="space-y-3 text-sm">
              {ticketData.map((t, i) => (
                <li key={t.status} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-sm" style={{ background: ["#12295a", "#1d63e3", "#7fa6f3"][i] }} />
                    {t.status}
                  </span>
                  <span className="font-semibold tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </>
  );
}
