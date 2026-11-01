"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Modal, useToast } from "@/components/client-ui";
import { Badge, buttonClass, Card, DataTable, Field, inputClass, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { employeeById, employees, formatDate, tasks as seed, type Task } from "@/lib/sample-data";

export default function AdminTasks() {
  const [list, setList] = useState<Task[]>(seed);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const { show, toast } = useToast();
  const rows = list.filter((t) => filter === "All" || t.status === filter);

  return (
    <>
      <PageHeader title="Tasks Management" subtitle="Create tasks and assign them to anyone in the company." actions={<button className={buttonClass("primary")} onClick={() => setOpen(true)}><Plus className="size-4" /> New task</button>} />
      <Card pad={false}>
        <div className="flex gap-2 border-b border-line p-4">
          {["All", "To do", "In progress", "Completed"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === s ? "border-navy-900 bg-navy-900 text-white" : "border-line text-ink-soft"}`}>{s}</button>
          ))}
        </div>
        <DataTable
          rows={rows}
          rowKey={(t) => t.id}
          columns={[
            { key: "t", header: "Task", cell: (t) => <span><span className="block font-medium text-navy-900">{t.title}</span><span className="line-clamp-1 text-xs text-ink-faint">{t.description}</span></span> },
            { key: "a", header: "Assigned to", cell: (t) => employeeById(t.assignee).name },
            { key: "d", header: "Deadline", cell: (t) => formatDate(t.deadline), className: "whitespace-nowrap" },
            { key: "p", header: "Priority", cell: (t) => <Badge tone={t.priority === "High" ? "bad" : t.priority === "Medium" ? "warn" : "grey"}>{t.priority}</Badge> },
            { key: "g", header: "Progress", cell: (t) => <span className="flex w-28 items-center gap-2"><Progress value={t.progress} /><span className="text-xs">{t.progress}%</span></span> },
            { key: "s", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          ]}
        />
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <form
          action={(f) => {
            const t: Task = { id: `T-${2220 + list.length}`, title: String(f.get("title")), description: String(f.get("desc")), assignee: String(f.get("who")), assignedBy: "Sana Malik", deadline: String(f.get("due")), status: "To do", progress: 0, priority: f.get("priority") as Task["priority"] };
            setList((l) => [t, ...l]);
            setOpen(false);
            show(`Task assigned to ${employeeById(t.assignee).name}`);
          }}
          className="space-y-4"
        >
          <Field label="Title"><input name="title" required className={inputClass} /></Field>
          <Field label="Description"><textarea name="desc" required rows={3} className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Assign to"><select name="who" className={inputClass}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
            <Field label="Deadline"><input name="due" type="date" required className={inputClass} /></Field>
            <Field label="Priority"><select name="priority" className={inputClass}><option>High</option><option>Medium</option><option>Low</option></select></Field>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Assign task</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
