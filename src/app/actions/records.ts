"use server";

import { PDFDocument } from "pdf-lib";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPdf, MAX_POLICY_BYTES } from "@/lib/files";
import { POLICY_CATEGORIES } from "@/lib/records";
import { localDate } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

/* ---------------- Policies ---------------- */

const PolicySchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Enter the policy title.").max(120),
  category: z.enum(POLICY_CATEGORIES as [string, ...string[]], "Choose a category."),
  version: z.string().trim().min(1, "Enter a version, for example v1.0.").max(20),
  summary: z.string().trim().max(400).optional(),
});

/** Publishes a new policy, or a new version of an existing one. The PDF is checked by its contents. */
export async function savePolicy(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const parsed = PolicySchema.safeParse({ id: form.get("id") || undefined, title: form.get("title"), category: form.get("category"), version: form.get("version"), summary: form.get("summary") || undefined });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Attach the policy as a PDF." };
  if (file.size > MAX_POLICY_BYTES) return { ok: false, message: "The PDF is larger than 5 MB. Please compress it and try again." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(bytes)) return { ok: false, message: "That file isn't a PDF." };
  let pages: number | null = null;
  try {
    pages = (await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })).getPageCount();
  } catch {
    return { ok: false, message: "That PDF couldn't be read. It may be damaged." };
  }
  const fileName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 100) || "policy.pdf";
  const fileFields = { fileData: Buffer.from(bytes), fileName, fileSize: bytes.length, pages, updatedBy: me.email };

  let policyId: string;
  if (id) {
    const before = await db.policy.findUnique({ where: { id }, select: { title: true, version: true } });
    if (!before) return { ok: false, message: "That policy no longer exists." };
    if (before.version === data.version) return { ok: false, message: `${before.title} is already at ${data.version}. Give the new version a new number.` };
    await db.policy.update({ where: { id }, data: { ...data, ...fileFields } });
    await audit(me.email, "policy.version", "Policy", id, before, { version: data.version, fileName });
    policyId = id;
  } else {
    const p = await db.policy.create({ data: { ...data, ...fileFields } });
    await audit(me.email, "policy.create", "Policy", p.id, undefined, { ...data, fileName });
    policyId = p.id;
  }
  const staff = await db.employee.findMany({ where: { status: { not: "INACTIVE" } }, select: { id: true } });
  await db.notification.createMany({ data: staff.map((s) => ({ employeeId: s.id, type: "policy", message: `${id ? "Updated" : "New"} policy: ${data.title} (${data.version}).`, link: `/employee/policies#${policyId}` })) });
  revalidatePath("/admin/policies");
  revalidatePath("/employee/policies");
  return { ok: true, message: `${data.title} ${data.version} published. All staff have been notified.` };
}

/* ---------------- Tasks ---------------- */

export async function updateTaskProgress(taskId: string, progress: number, note: string): Promise<ActionResult> {
  const me = await authorize();
  const p = z.number().int().min(0).max(100).safeParse(progress);
  if (!p.success) return { ok: false, message: "Progress must be between 0 and 100." };
  const n = note.trim().slice(0, 500) || null;
  const t = await db.task.findUnique({ where: { id: taskId } });
  if (!t || t.assigneeId !== me.employeeId) return { ok: false, message: "That task wasn't found." };
  const status = p.data >= 100 ? "COMPLETED" : p.data > 0 ? "IN_PROGRESS" : "TODO";
  await db.task.update({ where: { id: taskId }, data: { progress: p.data, status, ...(n ? { note: n } : {}) } });
  if (status === "COMPLETED" && t.status !== "COMPLETED") {
    await db.notification.create({ data: { employeeId: t.assignedById, type: "task", message: `${me.name} completed “${t.title}”.`, link: "/admin/tasks" } });
  }
  revalidatePath("/employee/tasks");
  revalidatePath("/admin/tasks");
  return { ok: true, message: status === "COMPLETED" ? "Task marked complete." : "Progress updated." };
}

const TaskSchema = z.object({
  title: z.string().trim().min(3, "Enter a task title.").max(120),
  description: z.string().trim().min(5, "Describe the task (at least 5 characters).").max(1000),
  assigneeId: z.string().min(1, "Choose who should do it."),
  deadline: z.iso.date("Choose a deadline."),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export async function createTask(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const parsed = TaskSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.deadline < localDate(new Date())) return { ok: false, message: "The deadline can't be in the past." };
  const who = await db.employee.findUnique({ where: { id: d.assigneeId }, select: { name: true, status: true } });
  if (!who || who.status === "INACTIVE") return { ok: false, message: "Choose an active employee." };
  let id = "";
  for (let i = 0; i < 3 && !id; i++) {
    const all = await db.task.findMany({ select: { id: true } });
    const candidate = `T-${Math.max(2200, ...all.map((t) => Number(t.id.replace("T-", "")) || 0)) + 1}`;
    try {
      await db.task.create({ data: { id: candidate, ...d, deadline: new Date(`${d.deadline}T00:00:00Z`), assignedById: me.employeeId } });
      id = candidate;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!id) return { ok: false, message: "We couldn't save the task. Please try again." };
  await db.notification.create({ data: { employeeId: d.assigneeId, type: "task", message: `New task from ${me.name}: ${d.title}.`, link: "/employee/tasks" } });
  await audit(me.email, "task.create", "Task", id, undefined, d);
  revalidatePath("/admin/tasks");
  return { ok: true, message: `Task ${id} assigned to ${who.name}. They've been notified.` };
}
