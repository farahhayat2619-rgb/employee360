"use client";

import clsx from "clsx";
import { Download, Printer, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { REPORTS, type ReportData, type ReportRow } from "@/lib/report-types";
import { formatPKR } from "@/lib/sample-data";
import { Bars, Donut, TrendLine } from "./charts";
import { buttonClass, Card, DataTable, StatusBadge, type Column } from "./ui";

function toCsv(rows: ReportRow[], cols: ReportData["columns"]) {
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    // Stop spreadsheet apps from running a cell as a formula
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replaceAll('"', '""')}"`;
  };
  return [cols.map((c) => esc(c.header)).join(","), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(","))].join("\r\n");
}

export function ReportsView({ data }: { data: ReportData }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, start] = useTransition();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(data.from);
  const [to, setTo] = useState(data.to);

  const go = (next: Partial<{ report: string; from: string; to: string; dept: string }>) => {
    const p = new URLSearchParams({ report: data.id, from: data.from, to: data.to, ...(data.lockedDept ? {} : { dept: data.dept }), ...next });
    if (p.get("dept") === "All") p.delete("dept");
    start(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
  };

  const rows = useMemo(() => (q ? data.rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase()))) : data.rows), [data.rows, q]);

  const columns: Column<ReportRow>[] = data.columns.map((c) => ({
    key: c.key,
    header: c.header,
    cell: (r) => {
      const v = r[c.key];
      if (c.kind === "status") return <StatusBadge status={String(v)} />;
      if (c.kind === "money") return formatPKR(Number(v));
      if (c.kind === "pct") return `${v}%`;
      return v;
    },
    className: c.kind && c.kind !== "status" ? "text-right tabular-nums whitespace-nowrap" : undefined,
  }));

  function download() {
    const blob = new Blob(["﻿" + toCsv(rows, data.columns)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${data.name.toLowerCase().replaceAll(" ", "-")}-${data.id === "daily" ? data.to : `${data.from}-to-${data.to}`}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const chart = data.chart;
  const dateChanged = from !== data.from || to !== data.to;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto print:hidden lg:flex-col lg:overflow-visible" aria-label="Reports">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => go({ report: r.id })}
            aria-current={r.id === data.id ? "page" : undefined}
            className={clsx("rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition-colors", r.id === data.id ? "bg-navy-900 font-medium text-white" : "text-ink-soft hover:bg-surface hover:text-navy-900")}
          >
            {r.name}
          </button>
        ))}
      </nav>
      <div className={clsx("min-w-0 space-y-6 transition-opacity", loading && "opacity-60")} aria-busy={loading}>
        <Card
          title={`${data.name} report`}
          action={
            <span className="flex gap-2 print:hidden">
              <button className={buttonClass("outline", "sm")} onClick={download} disabled={!rows.length}>
                <Download className="size-3.5" /> CSV
              </button>
              <button className={buttonClass("outline", "sm")} onClick={() => window.print()} title="Opens the print dialog. Choose “Save as PDF”.">
                <Printer className="size-3.5" /> Print / PDF
              </button>
            </span>
          }
          pad={false}
        >
          <div className="flex flex-col gap-3 border-b border-line p-4 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this report" className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm" aria-label="Search this report" />
            </div>
            {data.lockedDept ? (
              <span className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-ink-soft">{data.lockedDept}</span>
            ) : (
              <select value={data.dept} onChange={(e) => go({ dept: e.target.value })} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm" aria-label="Department">
                <option value="All">All departments</option>
                {data.departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            )}
            <form
              className="flex flex-wrap items-center gap-2 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                go({ from, to });
              }}
            >
              {data.id !== "daily" && (
                <>
                  <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-line px-2 py-1.5" aria-label="From date" required />
                  <span className="text-ink-faint">to</span>
                </>
              )}
              <input type="date" value={to} min={data.id === "daily" ? undefined : from} max={data.today} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-line px-2 py-1.5" aria-label={data.id === "daily" ? "Date" : "To date"} required />
              <button type="submit" disabled={!dateChanged || loading} className={buttonClass("primary", "sm")}>
                Apply
              </button>
            </form>
          </div>
          <div className="hidden px-5 pt-4 text-sm text-ink-soft print:block">
            {data.lockedDept ?? (data.dept === "All" ? "All departments" : data.dept)} · {data.id === "daily" ? data.to : `${data.from} to ${data.to}`}
          </div>
          {data.note && <p className="px-5 pt-4 text-xs text-ink-faint">{data.note}</p>}
          <div className="p-5">
            {chart ? (
              <>
                <p className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">{chart.title}</p>
                {chart.type === "line" ? (
                  <TrendLine data={chart.data} x={chart.x} y={chart.y} unit="%" domain={[0, 100]} />
                ) : chart.type === "donut" ? (
                  <Donut data={chart.data} name={chart.x} value={chart.y} />
                ) : (
                  <Bars data={chart.data} x={chart.x} y={chart.y} horizontal={chart.horizontal} format={chart.format} />
                )}
              </>
            ) : (
              <p className="py-10 text-center text-sm text-ink-faint">No data to chart for these filters.</p>
            )}
          </div>
        </Card>
        <Card pad={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs text-ink-faint">
            <span>
              {rows.length} {rows.length === 1 ? "row" : "rows"}
              {q && ` matching “${q}”`}
            </span>
          </div>
          <DataTable rows={rows} rowKey={(r) => JSON.stringify(r)} columns={columns} empty="No records for these filters." />
        </Card>
      </div>
    </div>
  );
}
