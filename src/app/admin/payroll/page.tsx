import { Receipt, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { Tabs } from "@/components/client-ui";
import { PayrollActions, SlipTable } from "@/components/payroll-views";
import { Badge, Card, DataTable, PageHeader, StatCard } from "@/components/ui";
import { payrollMonth, payrollOverview } from "@/lib/payroll";
import { formatPKR } from "@/lib/sample-data";
import { monthLabel } from "@/lib/time";

export default async function AdminPayroll(props: PageProps<"/admin/payroll">) {
  const { records } = (await props.searchParams) as { records?: string };
  const o = await payrollOverview();
  const viewing = records && o.history.some((h) => h.month === records) ? records : null;
  const recordRows = viewing ? await payrollMonth(viewing) : [];
  const total = o.rows.reduce((s, r) => ({ gross: s.gross + r.gross, net: s.net + r.net, ded: s.ded + r.deductions }), { gross: 0, net: 0, ded: 0 });
  const label = monthLabel(o.runMonth);

  return (
    <>
      <PageHeader
        title="Payroll Management"
        subtitle={o.canRun ? `Run payroll for ${label}, check the figures, then publish salary slips to employees.` : "All payroll runs are published."}
        actions={<PayrollActions month={o.runMonth} stage={o.stage} canRun={o.canRun} />}
      />
      {o.canRun && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Employees on payroll" value={o.rows.length} icon={Users} tone="navy" />
          <StatCard label="Gross payroll" value={<span className="text-lg">{formatPKR(total.gross)}</span>} icon={Receipt} tone="blue" />
          <StatCard label="Net payable" value={<span className="text-lg">{formatPKR(total.net)}</span>} hint={`${formatPKR(total.ded)} deductions`} icon={Wallet} tone="good" />
        </div>
      )}
      <Tabs
        initial={viewing ? "hist" : "run"}
        tabs={[
          ...(o.canRun
            ? [
                {
                  id: "run",
                  label: `${label} run`,
                  content: (
                    <>
                      {o.stage === "draft" && <p className="mb-3 text-sm text-ink-soft">Preview from current salary structures. Nothing is saved until you run payroll.</p>}
                      <SlipTable rows={o.rows} status={o.stage === "draft" ? "Preview" : "Draft"} />
                    </>
                  ),
                },
              ]
            : []),
          {
            id: "hist",
            label: "Salary records",
            content: viewing ? (
              <>
                <div className="mb-3 flex items-center gap-3 text-sm">
                  <Link href="/admin/payroll" className="font-medium text-accent-700 hover:underline">
                    All months
                  </Link>
                  <span className="text-ink-faint">/</span>
                  <span className="font-medium text-navy-900">{monthLabel(viewing)}</span>
                </div>
                <SlipTable rows={recordRows} status="Published" />
              </>
            ) : (
              <Card pad={false}>
                <DataTable
                  rows={o.history}
                  rowKey={(r) => r.month}
                  empty="No payroll has been published yet."
                  columns={[
                    {
                      key: "m",
                      header: "Month",
                      cell: (r) => (
                        <Link href={`/admin/payroll?records=${r.month}`} className="font-medium text-navy-900 hover:underline">
                          {monthLabel(r.month)}
                        </Link>
                      ),
                    },
                    { key: "n", header: "Employees paid", cell: (r) => r.count },
                    { key: "t", header: "Net paid", cell: (r) => formatPKR(r.net), className: "text-right tabular-nums whitespace-nowrap" },
                    { key: "s", header: "Status", cell: () => <Badge tone="good">Published</Badge> },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
      <p className="mt-4 text-xs text-ink-faint">Uses the demo company&apos;s simplified flat tax and provident fund rule. Not tax advice.</p>
    </>
  );
}
