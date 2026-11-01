import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { requirePortal } from "./auth";
import { db } from "./db";
import { isoOf, localDate } from "./time";
import type { PolicyView, TaskView } from "./types";

export const POLICY_CATEGORIES = ["HR Policies", "Attendance Policies", "Leave Policies", "Code of Conduct", "Employee Handbook", "Policy Documents"];

export async function listPolicies(portal: "employee" | "admin"): Promise<PolicyView[]> {
  await requirePortal(portal);
  const rows = await db.policy.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }], select: { id: true, title: true, category: true, version: true, summary: true, pages: true, fileSize: true, fileName: true, updatedAt: true } });
  return rows.map((p) => ({ id: p.id, title: p.title, category: p.category, version: p.version, summary: p.summary, pages: p.pages, fileSize: p.fileSize, hasFile: !!p.fileName, updated: isoOf(p.updatedAt) }));
}

const taskStatus = { TODO: "To do", IN_PROGRESS: "In progress", COMPLETED: "Completed" } as const;
const taskPriority = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" } as const;
const taskSelect = {
  id: true,
  title: true,
  description: true,
  assigneeId: true,
  assignee: { select: { name: true } },
  assignedBy: { select: { name: true } },
  deadline: true,
  status: true,
  progress: true,
  priority: true,
  note: true,
} satisfies Prisma.TaskSelect;

const toTask = (t: Prisma.TaskGetPayload<{ select: typeof taskSelect }>): TaskView => ({
  id: t.id,
  title: t.title,
  description: t.description,
  assigneeId: t.assigneeId,
  assignee: t.assignee.name,
  assignedBy: t.assignedBy.name,
  deadline: isoOf(t.deadline),
  status: taskStatus[t.status],
  progress: t.progress,
  priority: taskPriority[t.priority],
  note: t.note,
});

export async function myTasks() {
  const me = await requirePortal("employee");
  const rows = await db.task.findMany({ where: { assigneeId: me.employeeId }, orderBy: [{ deadline: "asc" }, { id: "asc" }], select: taskSelect });
  return { tasks: rows.map(toTask), today: localDate(new Date()) };
}

export async function allTasks() {
  await requirePortal("admin");
  const [rows, people] = await Promise.all([
    db.task.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: taskSelect }),
    db.employee.findMany({ where: { status: { not: "INACTIVE" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { tasks: rows.map(toTask), people, today: localDate(new Date()) };
}
