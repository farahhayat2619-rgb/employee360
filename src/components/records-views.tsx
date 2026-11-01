"use client";

import clsx from "clsx";
import { CalendarClock, CheckCircle2, Download, ExternalLink, FileText, Plus, Search, Upload } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { createTask, savePolicy, updateTaskProgress } from "@/app/actions/records";
import { formatDate } from "@/lib/sample-data";
import type { ActionResult, PolicyView, TaskView } from "@/lib/types";
import { Modal, Tabs, useToast, keepOnSubmit } from "./client-ui";
import { Badge, buttonClass, Card, DataTable, Field, inputClass, PageHeader, Progress, StatusBadge } from "./ui";

const size = (n: number | null) => (n === null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const priorityTone = (p: TaskView["priority"]) => (p === "High" ? "bad" : p === "Medium" ? "warn" : "grey");

function Err({ state }: { state: ActionResult }) {
  return state && !state.ok ? (
    <p className="rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad" role="alert">
      {state.message}
    </p>
  ) : null;
}

/* ---------------- Policies ---------------- */

export function PolicyLibrary({ policies, categories }: { policies: PolicyView[]; categories: string[] }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const list = policies.filter((p) => (cat === "All" || p.category === cat) && (p.title.toLowerCase().includes(q.toLowerCase()) || (p.summary ?? "").toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageHeader title="Company Policies" subtitle="The latest approved version of every policy. HR updates these documents." />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search policies" aria-label="Search policies" className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All", ...categories].map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={c === cat} className={clsx("rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap", c === cat ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-surface text-ink-soft hover:border-navy-100")}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <Card key={p.id} className="scroll-mt-24">
            <div id={p.id} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bad-50 text-bad">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-navy-900">{p.title}</p>
                <p className="text-xs text-ink-faint">{p.category}</p>
              </div>
            </div>
            {p.summary && <p className="mt-3 line-clamp-3 text-sm text-ink-soft">{p.summary}</p>}
            <p className="mt-3 text-xs text-ink-faint">
              {p.version}
              {p.pages ? ` · ${p.pages} page${p.pages > 1 ? "s" : ""}` : ""}
              {p.fileSize ? ` · ${size(p.fileSize)}` : ""} · Updated {formatDate(p.updated)}
            </p>
            {p.hasFile ? (
              <div className="mt-4 flex gap-2">
                <a href={`/api/policies/${p.id}`} target="_blank" rel="noopener" className={buttonClass("outline", "sm")}>
                  <ExternalLink className="size-3.5" /> Open
                </a>
                <a href={`/api/policies/${p.id}?download=1`} className={buttonClass("ghost", "sm")}>
                  <Download className="size-3.5" /> Download
                </a>
              </div>
            ) : (
              <p className="mt-4 text-xs text-ink-faint">HR hasn&apos;t uploaded the document yet.</p>
            )}
          </Card>
        ))}
        {list.length === 0 && <p className="col-span-full py-10 text-center text-sm text-ink-faint">No policies match your search.</p>}
      </div>
    </>
  );
}

export function PolicyAdmin({ policies, categories }: { policies: PolicyView[]; categories: string[] }) {
  const [form, setForm] = useState<{ policy: PolicyView | null; round: number } | null>(null);
  const { show, toast } = useToast();
  return (
    <>
      <PageHeader
        title="Company Policies"
        subtitle="Upload new policies or new versions. Employees always see the latest version."
        actions={
          <button className={buttonClass("primary")} onClick={() => setForm({ policy: null, round: Date.now() })}>
            <Upload className="size-4" /> Upload policy
          </button>
        }
      />
      <Card pad={false}>
        <DataTable
          rows={policies}
          rowKey={(p) => p.id}
          empty="No policies yet."
          columns={[
            {
              key: "t",
              header: "Policy",
              cell: (p) => (
                <span className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-bad" />
                  {p.hasFile ? (
                    <a href={`/api/policies/${p.id}`} target="_blank" rel="noopener" className="font-medium text-navy-900 hover:underline">
                      {p.title}
                    </a>
                  ) : (
                    <span className="font-medium text-navy-900">{p.title}</span>
                  )}
                </span>
              ),
            },
            { key: "c", header: "Category", cell: (p) => <span className="whitespace-nowrap">{p.category}</span> },
            { key: "v", header: "Version", cell: (p) => p.version },
            { key: "f", header: "File", cell: (p) => (p.hasFile ? <span className="whitespace-nowrap text-ink-soft">{p.pages} p · {size(p.fileSize)}</span> : <Badge tone="warn">Missing</Badge>) },
            { key: "u", header: "Updated", cell: (p) => formatDate(p.updated), className: "whitespace-nowrap" },
            {
              key: "a",
              header: "",
              cell: (p) => (
                <button className={buttonClass("ghost", "sm")} onClick={() => setForm({ policy: p, round: Date.now() })}>
                  New version
                </button>
              ),
            },
          ]}
        />
      </Card>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.policy ? `New version: ${form.policy.title}` : "Upload policy"}>
        {form && (
          <PolicyForm
            key={form.round}
            policy={form.policy}
            categories={categories}
            onClose={() => setForm(null)}
            onDone={(m) => {
              setForm(null);
              show(m);
            }}
          />
        )}
      </Modal>
      {toast}
    </>
  );
}

function PolicyForm({ policy, categories, onClose, onDone }: { policy: PolicyView | null; categories: string[]; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (p, f) => {
    const r = await savePolicy(p, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      {policy && <input type="hidden" name="id" value={policy.id} />}
      <Field label="Title">
        <input name="title" required minLength={3} maxLength={120} defaultValue={policy?.title} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select name="category" defaultValue={policy?.category ?? categories[0]} className={inputClass}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Version" hint={policy ? `Currently ${policy.version}` : undefined}>
          <input name="version" required maxLength={20} defaultValue={policy ? "" : "v1.0"} placeholder="e.g. v2.0" className={inputClass} />
        </Field>
      </div>
      <Field label="Short summary (optional)">
        <textarea name="summary" rows={2} maxLength={400} defaultValue={policy?.summary ?? ""} className={inputClass} />
      </Field>
      <Field label="Document (PDF, up to 5 MB)">
        <input name="file" type="file" required accept="application/pdf,.pdf" className={inputClass} />
      </Field>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Uploading…" : "Publish"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Tasks ---------------- */

export function MyTasks({ tasks, today }: { tasks: TaskView[]; today: string }) {
  const [edit, setEdit] = useState<TaskView | null>(null);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const { show, toast } = useToast();

  const save = (t: TaskView, p: number, n = "") =>
    start(async () => {
      const r = await updateTaskProgress(t.id, p, n);
      if (r) show(r.message);
      if (r?.ok) setEdit(null);
    });

  const grid = (items: TaskView[]) => (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((t) => {
        const overdue = t.status !== "Completed" && t.deadline < today;
        return (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-navy-900">{t.title}</p>
              <StatusBadge status={t.status} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">{t.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
              <span className="flex items-center gap-1">
                <CalendarClock className="size-3.5" /> Due {formatDate(t.deadline)}
              </span>
              {overdue && <Badge tone="bad">Overdue</Badge>}
              <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
              <span>· from {t.assignedBy}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Progress value={t.progress} tone={t.progress === 100 ? "good" : "blue"} />
              <span className="w-10 text-right text-sm font-semibold tabular-nums">{t.progress}%</span>
            </div>
            {t.note && <p className="mt-3 text-xs text-ink-faint">Your last note: “{t.note}”</p>}
            {t.status !== "Completed" && (
              <div className="mt-4 flex gap-2">
                <button
                  className={buttonClass("outline", "sm")}
                  onClick={() => {
                    setEdit(t);
                    setProgress(t.progress);
                    setNote("");
                  }}
                >
                  Update progress
                </button>
                <button disabled={pending} className={buttonClass("ghost", "sm")} onClick={() => save(t, 100)}>
                  <CheckCircle2 className="size-3.5" /> Mark complete
                </button>
              </div>
            )}
          </Card>
        );
      })}
      {items.length === 0 && <p className="col-span-full py-10 text-center text-sm text-ink-faint">No tasks here.</p>}
    </div>
  );

  const active = tasks.filter((t) => t.status !== "Completed");
  const done = tasks.filter((t) => t.status === "Completed");
  return (
    <>
      <PageHeader title="Tasks & Assignments" subtitle="Work assigned to you by your manager and HR." />
      <Tabs
        tabs={[
          { id: "a", label: `Assigned (${active.length})`, content: grid(active) },
          { id: "c", label: `Completed (${done.length})`, content: grid(done) },
        ]}
      />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `Update: ${edit.title}` : ""}>
        <div className="space-y-4">
          <Field label={`Work progress: ${progress}%`}>
            <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-accent-600" aria-label="Task progress" />
          </Field>
          <Field label="Note for your manager (optional)">
            <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button disabled={pending} className={buttonClass("primary")} onClick={() => edit && save(edit, progress, note)}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
      {toast}
    </>
  );
}

export function TaskAdmin({ tasks, people, today }: { tasks: TaskView[]; people: { id: string; name: string }[]; today: string }) {
  const [round, setRound] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const { show, toast } = useToast();
  const rows = tasks.filter((t) => filter === "All" || t.status === filter);
  return (
    <>
      <PageHeader
        title="Tasks Management"
        subtitle="Create tasks and assign them to anyone in the company."
        actions={
          <button className={buttonClass("primary")} onClick={() => setRound(Date.now())}>
            <Plus className="size-4" /> New task
          </button>
        }
      />
      <Card pad={false}>
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          {["All", "To do", "In progress", "Completed"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === s ? "border-navy-900 bg-navy-900 text-white" : "border-line text-ink-soft"}`}>
              {s}
            </button>
          ))}
        </div>
        <DataTable
          rows={rows}
          rowKey={(t) => t.id}
          empty="No tasks match this filter."
          columns={[
            {
              key: "t",
              header: "Task",
              cell: (t) => (
                <span>
                  <span className="block font-medium text-navy-900">{t.title}</span>
                  <span className="line-clamp-1 text-xs text-ink-faint">{t.note ? `Latest note: ${t.note}` : t.description}</span>
                </span>
              ),
            },
            { key: "a", header: "Assigned to", cell: (t) => <span className="whitespace-nowrap">{t.assignee}</span> },
            { key: "d", header: "Deadline", cell: (t) => <span className={clsx("whitespace-nowrap", t.status !== "Completed" && t.deadline < today && "font-medium text-bad")}>{formatDate(t.deadline)}</span> },
            { key: "p", header: "Priority", cell: (t) => <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge> },
            {
              key: "g",
              header: "Progress",
              cell: (t) => (
                <span className="flex w-28 items-center gap-2">
                  <Progress value={t.progress} />
                  <span className="text-xs">{t.progress}%</span>
                </span>
              ),
            },
            { key: "s", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          ]}
        />
      </Card>
      <Modal open={round !== null} onClose={() => setRound(null)} title="New task">
        {round !== null && (
          <TaskForm
            key={round}
            people={people}
            today={today}
            onClose={() => setRound(null)}
            onDone={(m) => {
              setRound(null);
              show(m);
            }}
          />
        )}
      </Modal>
      {toast}
    </>
  );
}

function TaskForm({ people, today, onClose, onDone }: { people: { id: string; name: string }[]; today: string; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (p, f) => {
    const r = await createTask(p, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <Field label="Title">
        <input name="title" required minLength={3} maxLength={120} className={inputClass} />
      </Field>
      <Field label="Description">
        <textarea name="description" required minLength={5} maxLength={1000} rows={3} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Assign to">
          <select name="assigneeId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose
            </option>
            {people.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Deadline">
          <input name="deadline" type="date" required min={today} className={inputClass} />
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue="MEDIUM" className={inputClass}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </Field>
      </div>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : "Assign task"}
        </button>
      </div>
    </form>
  );
}
