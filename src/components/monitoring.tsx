"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
import { correctAttendance } from "@/app/actions/attendance";
import { monthLabel } from "@/lib/time";
import { announcements as seedAnn, departments as sampleDepartments, formatDate, employees, goals as seedGoals, type Announcement, type Goal } from "@/lib/sample-data";
import { TrendLine, Bars } from "./charts";
import { Modal, useToast } from "./client-ui";
import type { ActionResult, BoardRow, DepartmentSummary } from "@/lib/types";
import { SourceBadge } from "./attendance-parts";
import { Filters } from "./people";
import { Avatar, Badge, buttonClass, Card, DataTable, Field, inputClass, Progress, StatusBadge } from "./ui";

type Board = { date: string; today: string; holiday: string | null; weekend: boolean; rows: BoardRow[]; trend: { day: string; rate: number }[]; month: string; scopeDept: string | null };
const boardStatuses = ["Present", "Late", "Absent", "On leave", "Not punched in"] as const;

export function AttendanceMonitor({ board, canCorrect, basePath }: { board: Board; canCorrect?: boolean; basePath: string }) {
  const router = useRouter();
  const { date, today, rows: all, trend, scopeDept } = board;
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [fix, setFix] = useState<{ row: BoardRow; round: number } | null>(null);
  const { show, toast } = useToast();
  const deptNames = useMemo(() => [...new Set(all.map((r) => r.department))].sort(), [all]);
  const scoped = all.filter((e) => dept === "All" || e.department === dept);
  const rows = scoped.filter((e) => (status === "All" || e.status === status) && (e.name.toLowerCase().includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase())));
  const count = (s: string) => scoped.filter((e) => e.status === s).length;
  const isToday = date === today;
  const dayName = isToday ? "today" : formatDate(date, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Date
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && router.push(`${basePath}?date=${e.target.value}`)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-navy-900" aria-label="Attendance date" />
        </label>
        {!isToday && (
          <button className={buttonClass("ghost", "sm")} onClick={() => router.push(basePath)}>
            Back to today
          </button>
        )}
        {scopeDept && <span className="text-sm text-ink-faint">Showing {scopeDept}</span>}
        {(board.holiday || board.weekend) && <Badge tone="grey">{board.holiday ? `Public holiday: ${board.holiday}` : "Weekend: no attendance expected"}</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {boardStatuses.filter((s) => s !== "Not punched in" || isToday).map((s) => (
          <button key={s} onClick={() => setStatus(status === s ? "All" : s)} className={`rounded-xl border bg-surface p-4 text-left shadow-card transition-colors ${status === s ? "border-accent-600 ring-2 ring-accent-100" : "border-line hover:border-navy-100"}`} aria-pressed={status === s}>
            <p className="text-xs font-medium text-ink-faint uppercase">{s}</p>
            <p className="mt-1 text-2xl font-semibold text-navy-900">{count(s)}</p>
          </button>
        ))}
      </div>
      <div className="space-y-6">
        <Card title={`Who's in ${dayName}`} className="min-w-0" pad={false}>
          <Filters q={q} setQ={setQ} dept={dept} setDept={scopeDept ? undefined : setDept} deptNames={deptNames} />
          <DataTable
            rows={rows}
            rowKey={(e) => e.id}
            empty="Nobody matches these filters."
            columns={[
              { key: "n", header: "Employee", cell: (e) => <span className="flex items-center gap-3"><Avatar name={e.name} size="sm" /><span><span className="block font-medium whitespace-nowrap text-navy-900">{e.name}</span><span className="text-xs text-ink-faint">{e.department}</span></span></span> },
              { key: "i", header: "In", cell: (e) => e.in ?? "—", className: "tabular-nums" },
              { key: "x", header: "Out", cell: (e) => e.out ?? "—", className: "tabular-nums" },
              { key: "o", header: "Office", cell: (e) => <span className="whitespace-nowrap text-ink-soft">{e.office}{e.in && e.distance !== null ? ` · ${e.distance} m` : ""}</span> },
              {
                key: "s",
                header: "Status",
                cell: (e) => (
                  <span className="flex flex-wrap gap-1.5">
                    <StatusBadge status={e.status} />
                    {e.early && <Badge tone="warn">Early out</Badge>}
                    <SourceBadge gpsVerified={e.gpsVerified} corrected={e.corrected} hasPunch={!!e.in} note={e.note} />
                  </span>
                ),
              },
              ...(canCorrect
                ? [{ key: "c", header: "", cell: (e: BoardRow) => <button className={buttonClass("ghost", "sm")} onClick={() => setFix({ row: e, round: Date.now() })}>Correct</button> }]
                : []),
            ]}
          />
        </Card>
        <Card title={`Attendance rate · ${monthLabel(board.month)}`}>
          {trend.length ? (
            <>
              <TrendLine data={trend} x="day" y="rate" unit="%" domain={[Math.max(0, Math.min(...trend.map((t) => t.rate)) - 5), 100]} />
              <p className="mt-2 text-xs text-ink-faint">
                Average {Math.round(trend.reduce((s, t) => s + t.rate, 0) / trend.length)}% across {trend.length} recorded day{trend.length > 1 ? "s" : ""}. Share of records marked present or late.
              </p>
            </>
          ) : (
            <p className="py-16 text-center text-sm text-ink-faint">No attendance recorded this month yet.</p>
          )}
        </Card>
      </div>
      <Modal open={!!fix} onClose={() => setFix(null)} title="Correct attendance">
        {fix && (
          <CorrectionForm
            key={fix.round}
            row={fix.row}
            date={date}
            onClose={() => setFix(null)}
            onDone={(m) => {
              setFix(null);
              show(m);
              router.refresh();
            }}
          />
        )}
      </Modal>
      {toast}
    </div>
  );
}

function CorrectionForm({ row, date, onClose, onDone }: { row: BoardRow; date: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (prev, f) => {
    const r = await correctAttendance(prev, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
  const current = { Present: "PRESENT", Late: "LATE", Absent: "ABSENT", "On leave": "ON_LEAVE" }[row.status as string] ?? "PRESENT";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="employeeId" value={row.id} />
      <input type="hidden" name="date" value={date} />
      <p className="text-sm text-ink-soft">
        {row.name} · {formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        {row.in && ` · punched in ${row.in}`}
      </p>
      <Field label="Mark as">
        <select name="status" defaultValue={current} className={inputClass}>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="ABSENT">Absent</option>
          <option value="ON_LEAVE">On leave</option>
        </select>
      </Field>
      <Field label="Reason (kept in the audit log)">
        <textarea name="note" required minLength={5} maxLength={300} rows={3} className={inputClass} placeholder="e.g. Field visit to client, confirmed by manager" />
      </Field>
      <p className="text-xs text-ink-faint">A corrected day is labelled “Corrected by HR”. It is never shown as GPS verified.</p>
      {state && !state.ok && (
        <p className="rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad" role="alert">
          {state.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : "Save correction"}
        </button>
      </div>
    </form>
  );
}

export function DepartmentsOverview({ departments }: { departments: DepartmentSummary[] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.id}>
            <p className="font-semibold text-navy-900">{d.name}</p>
            <p className="text-xs text-ink-faint">Head: {d.head ?? "Not assigned"}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-navy-50 py-2">
                <dt className="text-[11px] text-ink-faint">Staff</dt>
                <dd className="text-lg font-semibold text-navy-900">{d.headcount}</dd>
              </div>
              <div className="rounded-lg bg-navy-50 py-2">
                <dt className="text-[11px] text-ink-faint">Attendance</dt>
                <dd className="text-lg font-semibold text-navy-900">{d.attendanceRate === null ? "—" : `${d.attendanceRate}%`}</dd>
              </div>
              <div className="rounded-lg bg-navy-50 py-2">
                <dt className="text-[11px] text-ink-faint">Open tickets</dt>
                <dd className="text-lg font-semibold text-navy-900">{d.openTickets}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
      <Card title="Attendance rate by department · October">
        <Bars data={departments.filter((d) => d.attendanceRate !== null).map((d) => ({ dept: d.name, rate: d.attendanceRate as number }))} x="dept" y="rate" horizontal format="pct" />
      </Card>
    </div>
  );
}

export function PerformanceBoard({ scopeDept, canAssign }: { scopeDept?: string; canAssign?: boolean }) {
  const team = employees.filter((e) => !scopeDept || e.department === scopeDept);
  const [goals, setGoals] = useState<Goal[]>(seedGoals);
  const [open, setOpen] = useState(false);
  const { show, toast } = useToast();
  const goalStats = (id: string) => {
    const g = goals.filter((x) => x.employeeId === id);
    return g.length ? { count: g.length, avg: Math.round(g.reduce((s, x) => s + x.progress, 0) / g.length) } : null;
  };

  return (
    <>
      <Card
        title="Team performance & goals"
        action={
          canAssign && (
            <button className={buttonClass("primary", "sm")} onClick={() => setOpen(true)}>
              <Plus className="size-3.5" /> Assign goal
            </button>
          )
        }
        pad={false}
      >
        <DataTable
          rows={team}
          rowKey={(e) => e.id}
          columns={[
            { key: "n", header: "Employee", cell: (e) => <span className="flex items-center gap-3"><Avatar name={e.name} size="sm" /><span><span className="block font-medium text-navy-900">{e.name}</span><span className="text-xs text-ink-faint">{e.designation}</span></span></span> },
            { key: "d", header: "Department", cell: (e) => e.department },
            { key: "g", header: "Active goals", cell: (e) => goalStats(e.id)?.count ?? 0 },
            { key: "c", header: "Goal completion", cell: (e) => { const s = goalStats(e.id); return s ? <span className="flex w-32 items-center gap-2"><Progress value={s.avg} /><span className="text-xs tabular-nums">{s.avg}%</span></span> : <span className="text-xs text-ink-faint">No goals yet</span>; } },
            { key: "p", header: "KPI score", cell: (e) => <Badge tone={e.performance >= 85 ? "good" : e.performance >= 75 ? "blue" : "warn"}>{e.performance} / 100</Badge> },
          ]}
        />
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Assign a goal">
        <form
          action={(f) => {
            const g: Goal = { id: `G-${600 + goals.length}`, employeeId: String(f.get("emp")), period: f.get("period") as Goal["period"], title: String(f.get("title")), kpi: String(f.get("kpi")), target: String(f.get("target")), progress: 0, due: String(f.get("due")) };
            setGoals((l) => [...l, g]);
            setOpen(false);
            show(`Goal assigned to ${employees.find((e) => e.id === g.employeeId)?.name}`);
          }}
          className="space-y-4"
        >
          <Field label="Employee">
            <select name="emp" className={inputClass} required>
              {team.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Period">
              <select name="period" className={inputClass}>
                <option>Monthly</option>
                <option>Annual</option>
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" name="due" required className={inputClass} />
            </Field>
          </div>
          <Field label="Goal">
            <input name="title" required className={inputClass} placeholder="e.g. Reduce complaint resolution time" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="KPI">
              <input name="kpi" required className={inputClass} placeholder="Average days to resolve" />
            </Field>
            <Field label="Target">
              <input name="target" required className={inputClass} placeholder="Under 3 days" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Assign goal</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}

export function AnnouncementsManager({ author }: { author: string }) {
  const [list, setList] = useState<Announcement[]>(seedAnn);
  const [open, setOpen] = useState(false);
  const { show, toast } = useToast();
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className={buttonClass("primary")} onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New announcement
        </button>
      </div>
      <Card pad={false}>
        <DataTable
          rows={list}
          rowKey={(a) => a.id}
          columns={[
            { key: "t", header: "Title", cell: (a) => <span><span className="block font-medium text-navy-900">{a.title}</span><span className="line-clamp-1 text-xs text-ink-faint">{a.body}</span></span> },
            { key: "ty", header: "Type", cell: (a) => <Badge tone={a.type === "Important" ? "bad" : a.type === "Holiday" ? "good" : "blue"}>{a.type}</Badge> },
            { key: "au", header: "Audience", cell: (a) => a.audience },
            { key: "by", header: "Posted by", cell: (a) => a.author },
            { key: "d", header: "Date", cell: (a) => a.date, className: "whitespace-nowrap tabular-nums" },
          ]}
        />
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="New announcement">
        <form
          action={(f) => {
            const a: Announcement = { id: `AN-${89 + list.length - 5}`, title: String(f.get("title")), body: String(f.get("body")), type: f.get("type") as Announcement["type"], audience: String(f.get("audience")), author, date: "2026-11-02" };
            setList((l) => [a, ...l]);
            setOpen(false);
            show(`Announcement sent to ${a.audience.toLowerCase()}`);
          }}
          className="space-y-4"
        >
          <Field label="Title">
            <input name="title" required className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select name="type" className={inputClass}>
                <option>HR</option>
                <option>Company news</option>
                <option>Holiday</option>
                <option>Reminder</option>
                <option>Important</option>
              </select>
            </Field>
            <Field label="Audience">
              <select name="audience" className={inputClass}>
                <option>All staff</option>
                {sampleDepartments.map((d) => (
                  <option key={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Message">
            <textarea name="body" required rows={5} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Publish</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
