"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { employeeById, formatDate, leaveRequests, type LeaveRequest } from "@/lib/sample-data";
import { Modal, Tabs, useToast } from "./client-ui";
import { Avatar, buttonClass, Card, DataTable, Field, inputClass, StatusBadge } from "./ui";

export function LeaveApprovals({ scopeDept }: { scopeDept?: string }) {
  const [list, setList] = useState<LeaveRequest[]>(() => leaveRequests.filter((l) => !scopeDept || employeeById(l.employeeId).department === scopeDept));
  const [decide, setDecide] = useState<{ r: LeaveRequest; approve: boolean } | null>(null);
  const { show, toast } = useToast();

  function save(f: FormData) {
    if (!decide) return;
    const { r, approve } = decide;
    const next: LeaveRequest["status"] = r.status === "Cancel requested" ? (approve ? "Cancelled" : "Approved") : approve ? "Approved" : "Rejected";
    setList((l) => l.map((x) => (x.id === r.id ? { ...x, status: next, comment: String(f.get("comment")) || undefined } : x)));
    setDecide(null);
    show(`${employeeById(r.employeeId).name} has been notified: ${next.toLowerCase()}`);
  }

  const awaiting = list.filter((l) => l.status === "Pending" || l.status === "Cancel requested");

  const table = (rows: LeaveRequest[], actions: boolean) => (
    <Card pad={false}>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No leave requests waiting for you."
        columns={[
          {
            key: "e",
            header: "Employee",
            cell: (r) => {
              const e = employeeById(r.employeeId);
              return (
                <span className="flex items-center gap-3">
                  <Avatar name={e.name} size="sm" />
                  <span>
                    <span className="block font-medium text-navy-900">{e.name}</span>
                    <span className="text-xs text-ink-faint">{e.department}</span>
                  </span>
                </span>
              );
            },
          },
          { key: "t", header: "Type", cell: (r) => r.type },
          { key: "d", header: "Dates", cell: (r) => (r.from === r.to ? formatDate(r.from) : `${formatDate(r.from, { day: "numeric", month: "short" })} – ${formatDate(r.to)}`), className: "whitespace-nowrap" },
          { key: "n", header: "Days", cell: (r) => r.days },
          { key: "r", header: "Reason", cell: (r) => <span className="text-ink-soft">{r.reason}</span> },
          { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
          ...(actions
            ? [
                {
                  key: "a",
                  header: "",
                  cell: (r: LeaveRequest) => (
                    <span className="flex gap-1">
                      <button className={buttonClass("primary", "sm")} onClick={() => setDecide({ r, approve: true })}>
                        <Check className="size-3.5" /> {r.status === "Cancel requested" ? "Allow cancel" : "Approve"}
                      </button>
                      <button className={buttonClass("outline", "sm")} onClick={() => setDecide({ r, approve: false })}>
                        <X className="size-3.5" /> {r.status === "Cancel requested" ? "Keep" : "Reject"}
                      </button>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
    </Card>
  );

  return (
    <>
      <Tabs
        tabs={[
          { id: "w", label: `Awaiting decision (${awaiting.length})`, content: table(awaiting, true) },
          { id: "all", label: "All requests", content: table(list, false) },
        ]}
      />
      <Modal open={!!decide} onClose={() => setDecide(null)} title={decide?.approve ? "Approve request" : "Decline request"}>
        {decide && (
          <form action={save} className="space-y-4">
            <p className="text-sm text-ink-soft">
              {employeeById(decide.r.employeeId).name} · {decide.r.type} leave · {decide.r.days} day{decide.r.days > 1 ? "s" : ""} from {formatDate(decide.r.from)}
            </p>
            <Field label={decide.approve ? "Comment (optional)" : "Reason for declining"}>
              <textarea name="comment" rows={3} required={!decide.approve} className={inputClass} />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className={buttonClass("outline")} onClick={() => setDecide(null)}>Cancel</button>
              <button type="submit" className={buttonClass(decide.approve ? "primary" : "danger")}>Confirm</button>
            </div>
          </form>
        )}
      </Modal>
      {toast}
    </>
  );
}
