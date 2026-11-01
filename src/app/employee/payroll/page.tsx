"use client";

import clsx from "clsx";
import { Download } from "lucide-react";
import { useState } from "react";
import { buttonClass, Card, DataTable, PageHeader } from "@/components/ui";
import { currentUsers, employeeById, formatPKR, payslips, payslipTotals } from "@/lib/sample-data";

export default function PayrollPage() {
  const me = employeeById(currentUsers.employee);
  const [month, setMonth] = useState(payslips[0].month);
  const slip = payslips.find((p) => p.month === month)!;
  const t = payslipTotals(slip);

  const earnings = [
    ["Basic salary", slip.basic],
    ["House rent allowance", slip.house],
    ["Transport allowance", slip.transport],
    ["Medical allowance", slip.medical],
  ] as const;
  const deductions = [
    ["Income tax", slip.tax],
    ["Provident fund", slip.providentFund],
    ["Other deductions", slip.other],
  ] as const;

  return (
    <>
      <PageHeader
        title="Payroll & Salary"
        subtitle="Monthly salary slips published by HR."
        actions={
          <>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm" aria-label="Month">
              {payslips.map((p) => (
                <option key={p.month}>{p.month}</option>
              ))}
            </select>
            <button className={buttonClass("primary")} onClick={() => window.print()}>
              <Download className="size-4" /> Download PDF
            </button>
          </>
        }
      />

      <Card className="print:border-0 print:shadow-none">
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row">
          <div>
            <p className="text-lg font-semibold text-navy-900">Crescent Bank</p>
            <p className="text-sm text-ink-soft">Salary slip · {slip.month}</p>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-medium text-navy-900">{me.name}</p>
            <p className="text-ink-soft">
              {me.id} · {me.designation}
            </p>
            <p className="text-ink-soft">{me.department}</p>
          </div>
        </div>

        <div className="grid gap-8 py-5 md:grid-cols-2">
          <SlipList title="Earnings" rows={earnings} total={["Gross pay", t.gross]} />
          <SlipList title="Deductions" rows={deductions} total={["Total deductions", t.deductions]} negative />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-navy-900 px-5 py-4 text-white">
          <span className="text-sm text-navy-100/80">Net salary paid</span>
          <span className="text-2xl font-semibold tabular-nums">{formatPKR(t.net)}</span>
        </div>
        <p className="mt-3 text-xs text-ink-faint">Sample figures and a simplified tax rule for the demo. Phase 4 generates a branded PDF on the server.</p>
      </Card>

      <Card title="Previous salary records" className="mt-6 print:hidden" pad={false}>
        <DataTable
          rows={payslips}
          rowKey={(p) => p.month}
          columns={[
            { key: "m", header: "Month", cell: (p) => <button onClick={() => setMonth(p.month)} className={clsx("font-medium hover:underline", p.month === month ? "text-accent-700" : "text-navy-900")}>{p.month}</button> },
            { key: "b", header: "Basic", cell: (p) => formatPKR(p.basic), className: "tabular-nums text-right" },
            { key: "g", header: "Gross", cell: (p) => formatPKR(payslipTotals(p).gross), className: "tabular-nums text-right" },
            { key: "d", header: "Deductions", cell: (p) => formatPKR(payslipTotals(p).deductions), className: "tabular-nums text-right" },
            { key: "n", header: "Net", cell: (p) => <span className="font-semibold">{formatPKR(payslipTotals(p).net)}</span>, className: "tabular-nums text-right" },
          ]}
        />
      </Card>
    </>
  );
}

function SlipList({ title, rows, total, negative }: { title: string; rows: readonly (readonly [string, number])[]; total: [string, number]; negative?: boolean }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">{title}</h3>
      <ul className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span className="text-ink-soft">{k}</span>
            <span className="tabular-nums">{negative && v > 0 ? "− " : ""}{formatPKR(v)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-line pt-2 font-semibold text-navy-900">
          <span>{total[0]}</span>
          <span className="tabular-nums">{formatPKR(total[1])}</span>
        </li>
      </ul>
    </div>
  );
}
