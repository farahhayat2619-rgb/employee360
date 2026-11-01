"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Modal, Tabs, useToast } from "@/components/client-ui";
import { Badge, buttonClass, Card, Field, inputClass, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { currentUsers, formatDate, TODAY, tasks as seed, type Task, type TaskStatus } from "@/lib/sample-data";

export default function TasksPage() {
  const [list, setList] = useState<Task[]>(() => seed.filter((t) => t.assignee === currentUsers.employee));
  const [edit, setEdit] = useState<Task | null>(null);
  const [progress, setProgress] = useState(0);
  const { show, toast } = useToast();
  const today = TODAY;

  function save(id: string, p: number) {
    const status: TaskStatus = p >= 100 ? "Completed" : p > 0 ? "In progress" : "To do";
    setList((l) => l.map((t) => (t.id === id ? { ...t, progress: p, status } : t)));
    setEdit(null);
    show(status === "Completed" ? "Task marked complete" : "Progress updated");
  }

  const grid = (items: Task[]) => (
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
              <Badge tone={t.priority === "High" ? "bad" : t.priority === "Medium" ? "warn" : "grey"}>{t.priority}</Badge>
              <span>· from {t.assignedBy}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Progress value={t.progress} tone={t.progress === 100 ? "good" : "blue"} />
              <span className="w-10 text-right text-sm font-semibold tabular-nums">{t.progress}%</span>
            </div>
            {t.status !== "Completed" && (
              <div className="mt-4 flex gap-2">
                <button className={buttonClass("outline", "sm")} onClick={() => { setEdit(t); setProgress(t.progress); }}>
                  Update progress
                </button>
                <button className={buttonClass("ghost", "sm")} onClick={() => save(t.id, 100)}>
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

  const active = list.filter((t) => t.status !== "Completed");
  const done = list.filter((t) => t.status === "Completed");

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
        <form action={() => { if (edit) save(edit.id, progress); }} className="space-y-4">
          <Field label={`Work progress: ${progress}%`}>
            <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-accent-600" />
          </Field>
          <Field label="Note for your manager (optional)">
            <textarea rows={3} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setEdit(null)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Save</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
