import { Building2, CalendarDays, Headset, UserCheck, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { Bars, Donut, TrendLine } from "@/components/charts";
import { buttonClass, Card, PageHeader, StatCard } from "@/components/ui";
import { attendanceTrend, companyStats as c, departments, formatPKR, helpdesk, payrollByDept, ticketCounts, tickets } from "@/lib/sample-data";

export default function AdminDashboard() {
  const tc = ticketCounts(tickets);
  const ticketData = [
    { status: "Open", count: tc.open },
    { status: "Pending", count: tc.pending },
    { status: "Closed", count: tc.closed },
  ];
  const today = [
    { s: "Present", n: c.presentToday },
    { s: "Late", n: c.lateToday },
    { s: "Absent", n: c.absentToday },
    { s: "On leave", n: c.onLeaveToday },
  ];

  return (
    <>
      <PageHeader
        title="HR Dashboard"
        subtitle="Crescent Bank · Monday 2 November 2026"
        actions={
          <>
            <Link href="/admin/employees/new" className={buttonClass("primary")}>Register employee</Link>
            <Link href="/admin/reports" className={buttonClass("outline")}>Reports</Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total employees" value={c.totalEmployees} icon={Users} tone="navy" />
        <StatCard label="Active" value={c.activeEmployees} hint={`${c.totalEmployees - c.activeEmployees} inactive`} icon={UserCheck} tone="good" />
        <StatCard label="Departments" value={departments.length} icon={Building2} tone="navy" />
        <StatCard label="Leave pending" value={c.pendingLeave} icon={CalendarDays} tone="warn" />
        <StatCard label="Helpdesk open" value={helpdesk.filter((h) => h.status !== "Resolved").length} icon={Headset} tone="blue" />
        <StatCard label={`Payroll · ${c.payrollMonth}`} value={<span className="text-lg">{formatPKR(c.payrollNet)}</span>} hint={c.payrollStatus} icon={Wallet} tone="good" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Today's attendance">
          <div className="grid grid-cols-2 gap-3">
            {today.map((t) => (
              <div key={t.s} className="rounded-lg bg-navy-50 p-3">
                <p className="text-xs text-ink-faint">{t.s}</p>
                <p className="text-2xl font-semibold text-navy-900">{t.n}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/attendance" className="mt-4 inline-block text-xs font-medium text-accent-700 hover:underline">Open attendance monitor</Link>
        </Card>
        <Card title="Attendance rate · October" className="xl:col-span-2">
          <TrendLine data={attendanceTrend} x="day" y="rate" unit="%" domain={[85, 100]} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Payroll by department · October">
          <Bars data={payrollByDept} x="dept" y="net" horizontal format="pkr" />
        </Card>
        <Card title="Complaint tickets by status">
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
