"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { addHoliday, applyLeave, decideLeave, removeHoliday, saveAllowances, withdrawLeave } from "@/app/actions/leave";
import { formatDate } from "@/lib/sample-data";
import type { ActionResult, LeaveBalanceRow, LeaveRow } from "@/lib/types";
import { Modal, Tabs, useToast, keepOnSubmit } from "./client-ui";
import { Avatar, buttonClass, Card, DataTable, Field, inputClass, PageHeader, Progress, StatusBadge } from "./ui";

const dates = (r: { from: string; to: string }) => (r.from === r.to ? formatDate(r.from) : `${formatDate(r.from, { day: "numeric", month: "short" })} – ${formatDate(r.to)}`);

function Alert({ state }: { state: ActionResult }) {
  if (!state) return null;
  return (
    <p className={`rounded-lg px-4 py-3 text-sm ${state.ok ? "bg-good-50 text-good" : "bg-bad-50 text-bad"}`} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  );
}

function countWorkingDays(from: string, to: string, holidays: Set<string>) {
  let n = 0;
  for (let d = new Date(`${from}T12:00:00Z`); d <= new Date(`${to}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(d.toISOString().slice(0, 10))) n++;
  }
  return n;
}

/* ---------------- Employee: my leave ---------------- */

export function MyLeave({ today, year, balances, requests, approver, holidays }: { today: string; year: number; balances: LeaveBalanceRow[]; requests: LeaveRow[]; approver: string | null; holidays: string[] }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  const [pending, start] = useTransition();
  const { show, toast } = useToast();
  const router = useRouter();

  const cancel = (r: LeaveRow) =>
    start(async () => {
      const res = await withdrawLeave(r.id);
      if (res) show(res.message);
      router.refresh();
    });

  return (
    <>
      <PageHeader
        title="Leave"
        subtitle={approver ? `Requests go to ${approver}. Weekends and public holidays aren't counted.` : "Requests go to HR. Weekends and public holidays aren't counted."}
        actions={
          <button
            className={buttonClass("primary")}
            onClick={() => {
              setRound((n) => n + 1);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Apply for leave
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {balances.map((l) => {
          const left = l.allowed - l.used;
          return (
            <Card key={l.typeId}>
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">{l.type} leave</p>
              <p className="mt-1 text-3xl font-semibold text-navy-900 tabular-nums">
                {left} <span className="text-sm font-normal text-ink-soft">of {l.allowed} days left</span>
              </p>
              <div className="mt-3">
                <Progress value={l.allowed ? (l.used / l.allowed) * 100 : 100} tone={left <= 2 ? "warn" : "blue"} />
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">
                {l.used} used in {year}
                {l.pending > 0 && ` · ${l.pending} awaiting approval`}
              </p>
            </Card>
          );
        })}
      </div>

      <Card title="Leave history & approval status" className="mt-6" pad={false}>
        <DataTable
          rows={requests}
          rowKey={(r) => r.id}
          empty="You haven't applied for leave yet."
          columns={[
            { key: "id", header: "Request", cell: (r) => <span className="font-mono text-xs whitespace-nowrap">{r.id}</span> },
            { key: "type", header: "Type", cell: (r) => <span className="font-medium text-navy-900">{r.type}</span> },
            { key: "dates", header: "Dates", cell: dates, className: "whitespace-nowrap" },
            { key: "days", header: "Days", cell: (r) => r.days },
            { key: "reason", header: "Reason", cell: (r) => <span className="text-ink-soft">{r.reason}</span> },
            {
              key: "status",
              header: "Status",
              cell: (r) => (
                <div>
                  <StatusBadge status={r.status} />
                  {r.comment && <p className="mt-1 text-xs text-ink-faint">“{r.comment}”</p>}
                </div>
              ),
            },
            {
              key: "act",
              header: "",
              cell: (r) =>
                (r.status === "Pending" || (r.status === "Approved" && r.from > today)) && (
                  <button disabled={pending} className={buttonClass("ghost", "sm")} onClick={() => cancel(r)}>
                    {r.status === "Pending" ? "Withdraw" : "Request cancellation"}
                  </button>
                ),
            },
          ]}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Apply for leave">
        <ApplyForm key={round} today={today} balances={balances} holidays={holidays} onDone={() => router.refresh()} onClose={() => setOpen(false)} />
      </Modal>
      {toast}
    </>
  );
}

function ApplyForm({ today, balances, holidays, onDone, onClose }: { today: string; balances: LeaveBalanceRow[]; holidays: string[]; onDone: () => void; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (prev, f) => {
    const r = await applyLeave(prev, f);
    if (r?.ok) onDone();
    return r;
  }, undefined);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const hol = new Set(holidays);
  const days = from && to && to >= from ? countWorkingDays(from, to, hol) : 0;

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <Alert state={state} />
        <div className="flex justify-end">
          <button className={buttonClass("primary")} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <Field label="Leave type">
        <select name="leaveTypeId" className={inputClass} required>
          {balances.map((l) => (
            <option key={l.typeId} value={l.typeId}>
              {l.type} leave ({l.allowed - l.used - l.pending} days available)
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From">
          <input name="from" type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </Field>
        <Field label="To">
          <input name="to" type="date" required min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-800">{days > 0 ? `${days} working day${days > 1 ? "s" : ""}` : from && to ? "No working days in that range." : "Pick your dates to see the number of working days."}</p>
      <Field label="Reason">
        <textarea name="reason" required minLength={5} maxLength={500} rows={3} className={inputClass} />
      </Field>
      {state && !state.ok && <Alert state={state} />}
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={days === 0 || pending} className={buttonClass("primary")}>
          {pending ? "Sending…" : "Submit request"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Management / HR: approvals ---------------- */

export function LeaveApprovals({ rows }: { rows: LeaveRow[] }) {
  const [decide, setDecide] = useState<{ r: LeaveRow; approve: boolean; round: number } | null>(null);
  const { show, toast } = useToast();
  const router = useRouter();
  const awaiting = rows.filter((l) => l.status === "Pending" || l.status === "Cancel requested");

  const table = (list: LeaveRow[], actions: boolean) => (
    <Card pad={false}>
      <DataTable
        rows={list}
        rowKey={(r) => r.id}
        empty={actions ? "No leave requests waiting for you." : "No leave requests yet."}
        columns={[
          {
            key: "e",
            header: "Employee",
            cell: (r) => (
              <span className="flex items-center gap-3">
                <Avatar name={r.employee} size="sm" />
                <span>
                  <span className="block font-medium whitespace-nowrap text-navy-900">{r.employee}</span>
                  <span className="text-xs text-ink-faint">{r.department}</span>
                </span>
              </span>
            ),
          },
          { key: "t", header: "Type", cell: (r) => r.type },
          { key: "d", header: "Dates", cell: dates, className: "whitespace-nowrap" },
          { key: "n", header: "Days", cell: (r) => r.days },
          { key: "r", header: "Reason", cell: (r) => <span className="text-ink-soft">{r.reason}</span> },
          {
            key: "s",
            header: "Status",
            cell: (r) => (
              <div>
                <StatusBadge status={r.status} />
                {!actions && r.approver && r.status !== "Pending" && <p className="mt-1 text-xs whitespace-nowrap text-ink-faint">by {r.approver}</p>}
              </div>
            ),
          },
          ...(actions
            ? [
                {
                  key: "a",
                  header: "",
                  cell: (r: LeaveRow) => (
                    <span className="flex gap-1">
                      <button className={buttonClass("primary", "sm")} onClick={() => setDecide({ r, approve: true, round: Date.now() })}>
                        <Check className="size-3.5" /> {r.status === "Cancel requested" ? "Allow cancel" : "Approve"}
                      </button>
                      <button className={buttonClass("outline", "sm")} onClick={() => setDecide({ r, approve: false, round: Date.now() })}>
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
          { id: "all", label: "All requests", content: table(rows, false) },
        ]}
      />
      <Modal open={!!decide} onClose={() => setDecide(null)} title={decide?.approve ? (decide.r.status === "Cancel requested" ? "Allow cancellation" : "Approve request") : decide?.r.status === "Cancel requested" ? "Keep leave approved" : "Decline request"}>
        {decide && (
          <DecideForm
            key={decide.round}
            r={decide.r}
            approve={decide.approve}
            onClose={() => setDecide(null)}
            onDone={(msg) => {
              setDecide(null);
              show(msg);
              router.refresh();
            }}
          />
        )}
      </Modal>
      {toast}
    </>
  );
}

function DecideForm({ r, approve, onClose, onDone }: { r: LeaveRow; approve: boolean; onClose: () => void; onDone: (msg: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (prev, f) => {
    const res = await decideLeave(prev, f);
    if (res?.ok) onDone(res.message);
    return res;
  }, undefined);
  const needReason = !approve && r.status === "Pending";
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <input type="hidden" name="id" value={r.id} />
      <input type="hidden" name="decision" value={approve ? "approve" : "reject"} />
      <p className="text-sm text-ink-soft">
        {r.employee} · {r.type} leave · {r.days} day{r.days > 1 ? "s" : ""} · {dates(r)}
      </p>
      <Field label={needReason ? "Reason for declining" : "Comment (optional)"}>
        <textarea name="comment" rows={3} maxLength={300} required={needReason} className={inputClass} />
      </Field>
      {state && !state.ok && <Alert state={state} />}
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass(approve ? "primary" : "danger")}>
          {pending ? "Saving…" : "Confirm"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- HR: allowances and holidays ---------------- */

export function AllowancesForm({ year, types }: { year: number; types: { id: string; name: string; daysPerYear: number }[] }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(saveAllowances, undefined);
  return (
    <Card title={`Days per year, ${year}`} className="max-w-xl">
      <form onSubmit={keepOnSubmit(action)} className="space-y-3">
        {types.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4">
            <label htmlFor={`days_${t.id}`} className="text-sm font-medium text-navy-900">
              {t.name} leave
            </label>
            <input id={`days_${t.id}`} name={`days_${t.id}`} type="number" min={0} max={60} required defaultValue={t.daysPerYear} className={`${inputClass} w-24 text-right`} />
          </div>
        ))}
        <p className="text-xs text-ink-faint">Changing a number updates the {year} allowance for every employee. Days already taken stay as they are.</p>
        <Alert state={state} />
        <div className="flex justify-end pt-2">
          <button disabled={pending} className={buttonClass("primary")}>
            {pending ? "Saving…" : "Save allowances"}
          </button>
        </div>
      </form>
    </Card>
  );
}

export function HolidayCalendar({ holidays }: { holidays: { id: string; date: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addHoliday, undefined);
  const [busy, start] = useTransition();
  const { show, toast } = useToast();
  return (
    <Card pad={false}>
      <form onSubmit={keepOnSubmit(action)} key={state?.ok ? state.message : "form"} className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
        <input name="date" type="date" required className={`${inputClass} sm:w-44`} aria-label="Date" />
        <input name="name" required minLength={3} maxLength={80} placeholder="Holiday name" className={inputClass} aria-label="Holiday name" />
        <button disabled={pending} className={buttonClass("primary")}>
          <Plus className="size-4" /> Add
        </button>
      </form>
      {state && (
        <div className="border-b border-line p-4">
          <Alert state={state} />
        </div>
      )}
      <DataTable
        rows={holidays}
        rowKey={(h) => h.id}
        empty="No holidays added for this year."
        columns={[
          { key: "d", header: "Date", cell: (h) => <span className="whitespace-nowrap">{formatDate(h.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span> },
          { key: "n", header: "Holiday", cell: (h) => <span className="font-medium text-navy-900">{h.name}</span> },
          {
            key: "x",
            header: "",
            cell: (h) => (
              <button
                disabled={busy}
                className={buttonClass("ghost", "sm")}
                aria-label={`Remove ${h.name}`}
                onClick={() =>
                  start(async () => {
                    const r = await removeHoliday(h.id);
                    if (r) show(r.message);
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </button>
            ),
          },
        ]}
      />
      {toast}
    </Card>
  );
}
