"use client";

import { CheckCircle2, Download, Play, RefreshCw, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { publishPayroll, runPayroll } from "@/app/actions/payroll";
import { formatPKR } from "@/lib/sample-data";
import type { SlipView } from "@/lib/types";
import { useToast } from "./client-ui";
import { Avatar, Badge, buttonClass, Card, DataTable } from "./ui";

const monthName = (ym: string) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export function MonthPicker({ months, value, basePath }: { months: string[]; value: string; basePath: string }) {
  const router = useRouter();
  return (
    <select value={value} onChange={(e) => router.push(`${basePath}?month=${e.target.value}`)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm" aria-label="Month">
      {months.map((m) => (
        <option key={m} value={m}>
          {monthName(m)}
        </option>
      ))}
    </select>
  );
}

export function PayrollActions({ month, stage, canRun }: { month: string; stage: "draft" | "processed"; canRun: boolean }) {
  const [pending, start] = useTransition();
  const { show, toast } = useToast();
  const go = (fn: (m: string) => Promise<{ ok: boolean; message: string } | undefined>) =>
    start(async () => {
      const r = await fn(month);
      if (r) show(r.message);
    });
  if (!canRun) return <Badge tone="good"><CheckCircle2 className="mr-1 size-3.5" /> Up to date. Next run opens on 1 {monthName(month)}</Badge>;
  return (
    <>
      {stage === "draft" ? (
        <button disabled={pending} className={buttonClass("primary")} onClick={() => go(runPayroll)}>
          <Play className="size-4" /> {pending ? "Calculating…" : `Run ${monthName(month)} payroll`}
        </button>
      ) : (
        <>
          <button disabled={pending} className={buttonClass("outline")} onClick={() => go(runPayroll)}>
            <RefreshCw className="size-4" /> Recalculate
          </button>
          <button disabled={pending} className={buttonClass("accent")} onClick={() => go(publishPayroll)}>
            <Send className="size-4" /> {pending ? "Publishing…" : "Publish salary slips"}
          </button>
        </>
      )}
      {toast}
    </>
  );
}

export function SlipTable({ rows, status }: { rows: SlipView[]; status: "Preview" | "Draft" | "Published" }) {
  return (
    <Card pad={false}>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No employees with a salary structure."
        columns={[
          {
            key: "e",
            header: "Employee",
            cell: (r) => (
              <span className="flex items-center gap-3">
                <Avatar name={r.employee} size="sm" />
                <span>
                  <span className="block font-medium whitespace-nowrap text-navy-900">{r.employee}</span>
                  <span className="text-xs whitespace-nowrap text-ink-faint">
                    {r.employeeId} · {r.department}
                  </span>
                </span>
              </span>
            ),
          },
          { key: "b", header: "Basic", cell: (r) => formatPKR(r.basic), className: "text-right tabular-nums whitespace-nowrap" },
          { key: "a", header: "Allowances", cell: (r) => formatPKR(r.house + r.transport + r.medical), className: "text-right tabular-nums whitespace-nowrap" },
          { key: "t", header: "Tax", cell: (r) => formatPKR(r.tax), className: "text-right tabular-nums whitespace-nowrap" },
          { key: "p", header: "Provident fund", cell: (r) => formatPKR(r.providentFund), className: "text-right tabular-nums whitespace-nowrap" },
          { key: "n", header: "Net salary", cell: (r) => <span className="font-semibold">{formatPKR(r.net)}</span>, className: "text-right tabular-nums whitespace-nowrap" },
          { key: "s", header: "Slip", cell: () => <Badge tone={status === "Published" ? "good" : status === "Draft" ? "blue" : "grey"}>{status}</Badge> },
          {
            key: "d",
            header: "",
            cell: (r) =>
              status !== "Preview" && (
                <a href={`/api/payslips/${r.id}`} className={buttonClass("ghost", "sm")} aria-label={`Download PDF for ${r.employee}`} title="Download PDF">
                  <Download className="size-3.5" />
                </a>
              ),
          },
        ]}
      />
    </Card>
  );
}
