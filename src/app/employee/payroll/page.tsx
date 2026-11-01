import clsx from "clsx";
import { Download } from "lucide-react";
import Link from "next/link";
import { MonthPicker } from "@/components/payroll-views";
import { buttonClass, Card, DataTable, PageHeader } from "@/components/ui";
import { requirePortal } from "@/lib/auth";
import { COMPANY, mySlips } from "@/lib/payroll";
import { formatPKR } from "@/lib/sample-data";
import { monthLabel } from "@/lib/time";

export default async function PayrollPage(props: PageProps<"/employee/payroll">) {
  const { month: param } = (await props.searchParams) as { month?: string };
  const me = await requirePortal("employee");
  const slips = await mySlips();
  const slip = slips.find((s) => s.month === param) ?? slips[0];

  if (!slip) {
    return (
      <>
        <PageHeader title="Payroll & Salary" subtitle="Monthly salary slips published by HR." />
        <Card>
          <p className="py-10 text-center text-sm text-ink-faint">No salary slips have been published for you yet. You&apos;ll get a notification when your first one is ready.</p>
        </Card>
      </>
    );
  }

  const earnings: [string, number][] = [
    ["Basic salary", slip.basic],
    ["House rent allowance", slip.house],
    ["Transport allowance", slip.transport],
    ["Medical allowance", slip.medical],
  ];
  const deductions: [string, number][] = [
    ["Income tax", slip.tax],
    ["Provident fund", slip.providentFund],
    ["Other deductions", slip.other],
  ];

  return (
    <>
      <PageHeader
        title="Payroll & Salary"
        subtitle="Monthly salary slips published by HR."
        actions={
          <>
            <MonthPicker months={slips.map((s) => s.month)} value={slip.month} basePath="/employee/payroll" />
            <a href={`/api/payslips/${slip.id}`} className={buttonClass("primary")}>
              <Download className="size-4" /> Download PDF
            </a>
          </>
        }
      />

      <Card>
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row">
          <div>
            <p className="text-lg font-semibold text-navy-900">{COMPANY}</p>
            <p className="text-sm text-ink-soft">Salary slip · {monthLabel(slip.month)}</p>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-medium text-navy-900">{me.name}</p>
            <p className="text-ink-soft">
              {me.employeeId} · {me.designation}
            </p>
            <p className="text-ink-soft">{me.department}</p>
          </div>
        </div>
        <div className="grid gap-8 py-5 md:grid-cols-2">
          <SlipList title="Earnings" rows={earnings} total={["Gross pay", slip.gross]} />
          <SlipList title="Deductions" rows={deductions} total={["Total deductions", slip.deductions]} negative />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-navy-900 px-5 py-4 text-white">
          <span className="text-sm text-navy-100/80">Net salary paid</span>
          <span className="text-2xl font-semibold tabular-nums">{formatPKR(slip.net)}</span>
        </div>
        <p className="mt-3 text-xs text-ink-faint">Uses the demo company&apos;s simplified rule: a flat income tax on gross pay and provident fund on basic salary. Not tax advice.</p>
      </Card>

      <Card title="Previous salary records" className="mt-6" pad={false}>
        <DataTable
          rows={slips}
          rowKey={(p) => p.id}
          columns={[
            {
              key: "m",
              header: "Month",
              cell: (p) => (
                <Link href={`/employee/payroll?month=${p.month}`} className={clsx("font-medium whitespace-nowrap hover:underline", p.id === slip.id ? "text-accent-700" : "text-navy-900")}>
                  {monthLabel(p.month)}
                </Link>
              ),
            },
            { key: "b", header: "Basic", cell: (p) => formatPKR(p.basic), className: "tabular-nums text-right whitespace-nowrap" },
            { key: "g", header: "Gross", cell: (p) => formatPKR(p.gross), className: "tabular-nums text-right whitespace-nowrap" },
            { key: "d", header: "Deductions", cell: (p) => formatPKR(p.deductions), className: "tabular-nums text-right whitespace-nowrap" },
            { key: "n", header: "Net", cell: (p) => <span className="font-semibold">{formatPKR(p.net)}</span>, className: "tabular-nums text-right whitespace-nowrap" },
            {
              key: "pdf",
              header: "",
              cell: (p) => (
                <a href={`/api/payslips/${p.id}`} className={buttonClass("ghost", "sm")} aria-label={`Download ${monthLabel(p.month)} slip`}>
                  <Download className="size-3.5" /> PDF
                </a>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

function SlipList({ title, rows, total, negative }: { title: string; rows: [string, number][]; total: [string, number]; negative?: boolean }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">{title}</h3>
      <ul className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between gap-4">
            <span className="text-ink-soft">{k}</span>
            <span className="tabular-nums">
              {negative && v > 0 ? "− " : ""}
              {formatPKR(v)}
            </span>
          </li>
        ))}
        <li className="flex justify-between gap-4 border-t border-line pt-2 font-semibold text-navy-900">
          <span>{total[0]}</span>
          <span className="tabular-nums">{formatPKR(total[1])}</span>
        </li>
      </ul>
    </div>
  );
}
