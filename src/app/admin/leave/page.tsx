"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Tabs, useToast } from "@/components/client-ui";
import { LeaveApprovals } from "@/components/leave-approvals";
import { buttonClass, Card, DataTable, inputClass, PageHeader } from "@/components/ui";
import { formatDate, holidays as seedHolidays, leaveTypes } from "@/lib/sample-data";

export default function AdminLeave() {
  const [types, setTypes] = useState(leaveTypes.map((l) => ({ type: l.type, allowed: l.allowed })));
  const [holidays, setHolidays] = useState(seedHolidays);
  const { show, toast } = useToast();

  return (
    <>
      <PageHeader title="Leave Management" subtitle="Approve leave, set yearly allowances and keep the holiday calendar." />
      <Tabs
        tabs={[
          { id: "a", label: "Leave approvals", content: <LeaveApprovals /> },
          {
            id: "b",
            label: "Yearly allowances",
            content: (
              <Card title="Days per year, 2026" className="max-w-xl">
                <form
                  action={() => show("Allowances saved. Balances recalculate for every employee.")}
                  className="space-y-3"
                >
                  {types.map((t, i) => (
                    <div key={t.type} className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-navy-900">{t.type} leave</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={t.allowed}
                        onChange={(e) => setTypes((l) => l.map((x, j) => (j === i ? { ...x, allowed: Number(e.target.value) } : x)))}
                        className={`${inputClass} w-24 text-right`}
                        aria-label={`${t.type} days`}
                      />
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <button className={buttonClass("primary")}>Save allowances</button>
                  </div>
                </form>
              </Card>
            ),
          },
          {
            id: "c",
            label: "Holiday calendar",
            content: (
              <Card pad={false}>
                <form
                  action={(f) => {
                    setHolidays((h) => [...h, { date: String(f.get("date")), name: String(f.get("name")) }].sort((a, b) => a.date.localeCompare(b.date)));
                    show("Holiday added and announced to staff");
                  }}
                  className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row"
                >
                  <input name="date" type="date" required className={`${inputClass} sm:w-44`} aria-label="Date" />
                  <input name="name" required placeholder="Holiday name" className={inputClass} aria-label="Holiday name" />
                  <button className={buttonClass("primary")}>
                    <Plus className="size-4" /> Add
                  </button>
                </form>
                <DataTable
                  rows={holidays}
                  rowKey={(h) => h.date + h.name}
                  columns={[
                    { key: "d", header: "Date", cell: (h) => formatDate(h.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" }) },
                    { key: "n", header: "Holiday", cell: (h) => <span className="font-medium text-navy-900">{h.name}</span> },
                    {
                      key: "x",
                      header: "",
                      cell: (h) => (
                        <button className={buttonClass("ghost", "sm")} aria-label={`Remove ${h.name}`} onClick={() => setHolidays((l) => l.filter((x) => x !== h))}>
                          <Trash2 className="size-3.5" />
                        </button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
      {toast}
    </>
  );
}
