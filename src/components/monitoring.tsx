"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { announcements as seedAnn, attendanceTrend, departments, employees, goals as seedGoals, type Announcement, type Goal } from "@/lib/sample-data";
import { TrendLine, Bars } from "./charts";
import { Modal, useToast } from "./client-ui";
import { Filters } from "./people";
import { Avatar, Badge, buttonClass, Card, DataTable, Field, inputClass, Progress, StatusBadge } from "./ui";

// Demo punch times for today's board (not GPS-verified)
const punch: Record<string, { in: string | null; dist: number | null }> = {
  Present: { in: "08:52", dist: 41 },
  Late: { in: "09:31", dist: 63 },
  Absent: { in: null, dist: null },
  "On leave": { in: null, dist: null },
};

export function AttendanceMonitor({ scopeDept }: { scopeDept?: string }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState(scopeDept ?? "All");
  const [status, setStatus] = useState("All");
  const rows = useMemo(
    () => employees.filter((e) => (dept === "All" || e.department === dept) && (status === "All" || e.todayStatus === status) && e.name.toLowerCase().includes(q.toLowerCase())),
    [q, dept, status],
  );
  const scoped = employees.filter((e) => dept === "All" || e.department === dept);
  const count = (s: string) => scoped.filter((e) => e.todayStatus === s).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(["Present", "Late", "Absent", "On leave"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(status === s ? "All" : s)} className={`rounded-xl border bg-surface p-4 text-left shadow-card transition-colors ${status === s ? "border-accent-600 ring-2 ring-accent-100" : "border-line hover:border-navy-100"}`}>
            <p className="text-xs font-medium text-ink-faint uppercase">{s} today</p>
            <p className="mt-1 text-2xl font-semibold text-navy-900">{count(s)}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Who's in today" className="xl:col-span-2" pad={false}>
          <Filters q={q} setQ={setQ} dept={dept} setDept={scopeDept ? undefined : setDept} />
          <DataTable
            rows={rows}
            rowKey={(e) => e.id}
            columns={[
              { key: "n", header: "Employee", cell: (e) => <span className="flex items-center gap-3"><Avatar name={e.name} size="sm" /><span><span className="block font-medium text-navy-900">{e.name}</span><span className="text-xs text-ink-faint">{e.department}</span></span></span> },
              { key: "i", header: "Punch in", cell: (e) => punch[e.todayStatus].in ?? "—", className: "tabular-nums" },
              { key: "o", header: "Office", cell: (e) => <span className="text-ink-soft">{punch[e.todayStatus].in ? `${e.office} · ${punch[e.todayStatus].dist} m` : "—"}</span> },
              { key: "s", header: "Status", cell: (e) => <span className="flex gap-1.5"><StatusBadge status={e.todayStatus} />{punch[e.todayStatus].in && <Badge tone="grey">Demo</Badge>}</span> },
            ]}
          />
        </Card>
        <Card title="Attendance rate · October">
          <TrendLine data={attendanceTrend} x="day" y="rate" unit="%" domain={[85, 100]} />
          <p className="mt-2 text-xs text-ink-faint">Company average 95%. Lowest on 16 Oct (91%).</p>
        </Card>
      </div>
    </div>
  );
}

export function DepartmentsOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.id}>
            <p className="font-semibold text-navy-900">{d.name}</p>
            <p className="text-xs text-ink-faint">Head: {d.head}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-navy-50 py-2">
                <dt className="text-[11px] text-ink-faint">Staff</dt>
                <dd className="text-lg font-semibold text-navy-900">{d.headcount}</dd>
              </div>
              <div className="rounded-lg bg-navy-50 py-2">
                <dt className="text-[11px] text-ink-faint">Attendance</dt>
                <dd className="text-lg font-semibold text-navy-900">{d.attendanceRate}%</dd>
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
        <Bars data={departments.map((d) => ({ dept: d.name, rate: d.attendanceRate }))} x="dept" y="rate" horizontal format="pct" />
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
                {departments.map((d) => (
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
