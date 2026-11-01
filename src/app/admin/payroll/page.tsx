"use client";

import { CheckCircle2, Play, Send } from "lucide-react";
import { useState } from "react";
import { Tabs, useToast } from "@/components/client-ui";
import { Avatar, Badge, buttonClass, Card, DataTable, PageHeader, StatCard } from "@/components/ui";
import { employees, formatPKR } from "@/lib/sample-data";
import { Wallet, Users, Receipt } from "lucide-react";

// Demo salary structures derived from the employee list
const structures = employees.map((e, i) => {
  const basic = e.role === "management" ? 320_000 : e.role === "admin" ? 210_000 : 140_000 + (i % 5) * 15_000;
  const house = Math.round(basic * 0.4);
  const transport = 15_000;
  const medical = Math.round(basic * 0.1);
  const gross = basic + house + transport + medical;
  const tax = Math.round(gross * 0.085);
  const pf = Math.round(basic * 0.0833);
  return { e, basic, house, transport, medical, gross, tax, pf, net: gross - tax - pf };
});

export default function AdminPayroll() {
  const [stage, setStage] = useState<"draft" | "processed" | "published">("draft");
  const { show, toast } = useToast();
  const total = structures.reduce((s, r) => ({ gross: s.gross + r.gross, net: s.net + r.net, ded: s.ded + r.tax + r.pf }), { gross: 0, net: 0, ded: 0 });

  return (
    <>
      <PageHeader
        title="Payroll Management"
        subtitle="Run payroll for November 2026, then publish salary slips to employees."
        actions={
          stage === "draft" ? (
            <button className={buttonClass("primary")} onClick={() => { setStage("processed"); show("Payroll processed. Check the figures, then publish."); }}>
              <Play className="size-4" /> Run November payroll
            </button>
          ) : stage === "processed" ? (
            <button className={buttonClass("accent")} onClick={() => { setStage("published"); show(`${structures.length} salary slips published. Employees have been notified.`); }}>
              <Send className="size-4" /> Publish salary slips
            </button>
          ) : (
            <Badge tone="good"><CheckCircle2 className="mr-1 size-3.5" /> November slips published</Badge>
          )
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Employees on payroll" value={structures.length} icon={Users} tone="navy" />
        <StatCard label="Gross payroll" value={<span className="text-lg">{formatPKR(total.gross)}</span>} icon={Receipt} tone="blue" />
        <StatCard label="Net payable" value={<span className="text-lg">{formatPKR(total.net)}</span>} hint={`${formatPKR(total.ded)} deductions`} icon={Wallet} tone="good" />
      </div>
      <Tabs
        tabs={[
          {
            id: "run",
            label: "November 2026 run",
            content: (
              <Card pad={false}>
                <DataTable
                  rows={structures}
                  rowKey={(r) => r.e.id}
                  columns={[
                    { key: "e", header: "Employee", cell: (r) => <span className="flex items-center gap-3"><Avatar name={r.e.name} size="sm" /><span><span className="block font-medium text-navy-900">{r.e.name}</span><span className="text-xs text-ink-faint">{r.e.id} · {r.e.department}</span></span></span> },
                    { key: "b", header: "Basic", cell: (r) => formatPKR(r.basic), className: "text-right tabular-nums" },
                    { key: "a", header: "Allowances", cell: (r) => formatPKR(r.house + r.transport + r.medical), className: "text-right tabular-nums" },
                    { key: "t", header: "Tax", cell: (r) => formatPKR(r.tax), className: "text-right tabular-nums" },
                    { key: "p", header: "Provident fund", cell: (r) => formatPKR(r.pf), className: "text-right tabular-nums" },
                    { key: "n", header: "Net salary", cell: (r) => <span className="font-semibold">{formatPKR(r.net)}</span>, className: "text-right tabular-nums" },
                    { key: "s", header: "Slip", cell: () => <Badge tone={stage === "published" ? "good" : stage === "processed" ? "blue" : "grey"}>{stage === "published" ? "Published" : stage === "processed" ? "Ready" : "Draft"}</Badge> },
                  ]}
                />
              </Card>
            ),
          },
          {
            id: "hist",
            label: "Salary records",
            content: (
              <Card pad={false}>
                <DataTable
                  rows={["October 2026", "September 2026", "August 2026", "July 2026"].map((m, i) => ({ m, net: total.net - i * 41_500, n: structures.length - (i > 1 ? 1 : 0) }))}
                  rowKey={(r) => r.m}
                  columns={[
                    { key: "m", header: "Month", cell: (r) => <span className="font-medium text-navy-900">{r.m}</span> },
                    { key: "n", header: "Employees paid", cell: (r) => r.n },
                    { key: "t", header: "Net paid", cell: (r) => formatPKR(r.net), className: "text-right tabular-nums" },
                    { key: "s", header: "Status", cell: () => <Badge tone="good">Published</Badge> },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
      <p className="mt-4 text-xs text-ink-faint">Sample salaries and a simplified flat tax rule for the demo, clearly not real tax advice.</p>
      {toast}
    </>
  );
}
