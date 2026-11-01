"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Modal, useToast } from "@/components/client-ui";
import { buttonClass, Card, DataTable, Field, inputClass, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { currentUsers, employeeById, formatDate, leaveRequests, leaveTypes, TODAY, type LeaveRequest } from "@/lib/sample-data";

function workingDays(from: string, to: string) {
  let n = 0;
  for (let d = new Date(`${from}T12:00:00Z`); d <= new Date(`${to}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) n++;
  }
  return n;
}

export default function LeavePage() {
  const me = employeeById(currentUsers.employee);
  const [list, setList] = useState<LeaveRequest[]>(() => leaveRequests.filter((l) => l.employeeId === me.id));
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { show, toast } = useToast();
  const days = from && to && to >= from ? workingDays(from, to) : 0;

  function apply(form: FormData) {
    const req: LeaveRequest = {
      id: `LV-2026-${String(316 + list.length).padStart(4, "0")}`,
      employeeId: me.id,
      type: String(form.get("type")),
      from,
      to,
      days,
      reason: String(form.get("reason")),
      status: "Pending",
      applied: new Date().toISOString().slice(0, 10),
      approver: me.manager,
    };
    setList((l) => [req, ...l]);
    setOpen(false);
    setFrom("");
    setTo("");
    show(`Leave request sent to ${me.manager}`);
  }

  function requestCancel(id: string) {
    setList((l) => l.map((r) => (r.id === id ? { ...r, status: r.status === "Pending" ? "Cancelled" : "Cancel requested" } : r)));
    show("Cancellation sent");
  }

  return (
    <>
      <PageHeader
        title="Leave"
        subtitle={`Requests go to your reporting manager, ${me.manager}.`}
        actions={
          <button className={buttonClass("primary")} onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Apply for leave
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {leaveTypes.map((l) => {
          const left = l.allowed - l.used;
          return (
            <Card key={l.type}>
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">{l.type} leave</p>
              <p className="mt-1 text-3xl font-semibold text-navy-900 tabular-nums">
                {left} <span className="text-sm font-normal text-ink-soft">of {l.allowed} days left</span>
              </p>
              <div className="mt-3">
                <Progress value={(l.used / l.allowed) * 100} tone={left <= 2 ? "warn" : "blue"} />
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">{l.used} used in 2026</p>
            </Card>
          );
        })}
      </div>

      <Card title="Leave history & approval status" className="mt-6" pad={false}>
        <DataTable
          rows={list}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Request", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "type", header: "Type", cell: (r) => <span className="font-medium text-navy-900">{r.type}</span> },
            { key: "dates", header: "Dates", cell: (r) => (r.from === r.to ? formatDate(r.from) : `${formatDate(r.from, { day: "numeric", month: "short" })} – ${formatDate(r.to)}`), className: "whitespace-nowrap" },
            { key: "days", header: "Days", cell: (r) => r.days },
            { key: "reason", header: "Reason", cell: (r) => <span className="text-ink-soft">{r.reason}</span> },
            { key: "status", header: "Status", cell: (r) => <div><StatusBadge status={r.status} />{r.comment && <p className="mt-1 text-xs text-ink-faint">“{r.comment}”</p>}</div> },
            {
              key: "act",
              header: "",
              cell: (r) =>
                (r.status === "Pending" || (r.status === "Approved" && r.from > TODAY)) && (
                  <button className={buttonClass("ghost", "sm")} onClick={() => requestCancel(r.id)}>
                    {r.status === "Pending" ? "Withdraw" : "Request cancellation"}
                  </button>
                ),
            },
          ]}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Apply for leave">
        <form action={apply} className="space-y-4">
          <Field label="Leave type">
            <select name="type" className={inputClass} required>
              {leaveTypes.map((l) => (
                <option key={l.type} value={l.type}>
                  {l.type} leave ({l.allowed - l.used} days left)
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From">
              <input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            </Field>
            <Field label="To">
              <input type="date" required min={from} value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-800">{days > 0 ? `${days} working day${days > 1 ? "s" : ""}` : "Pick your dates to see the number of working days."}</p>
          <Field label="Reason">
            <textarea name="reason" required minLength={5} rows={3} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={days === 0} className={buttonClass("primary")}>
              Submit request
            </button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
