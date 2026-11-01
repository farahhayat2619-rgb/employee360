"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamScope } from "@/lib/performance";
import type { ActionResult } from "@/lib/types";

const refresh = () => {
  revalidatePath("/employee/goals");
  revalidatePath("/management/performance");
  revalidatePath("/admin/performance");
};

export async function updateGoalProgress(goalId: string, progress: number): Promise<ActionResult> {
  const me = await authorize();
  const p = z.number().int().min(0).max(100).safeParse(progress);
  if (!p.success) return { ok: false, message: "Progress must be between 0 and 100." };
  const g = await db.goal.findUnique({ where: { id: goalId } });
  if (!g || g.employeeId !== me.employeeId) return { ok: false, message: "That goal wasn't found." };
  await db.goal.update({ where: { id: goalId }, data: { progress: p.data } });
  refresh();
  return { ok: true, message: p.data === 100 ? `“${g.title}” marked as achieved.` : `Progress on “${g.title}” saved at ${p.data}%.` };
}

async function inTeam(employeeId: string) {
  const me = await authorize("management", "admin");
  const ok = await db.employee.count({ where: { AND: [{ id: employeeId }, teamScope(me)] } });
  return { me, ok: ok > 0 };
}

const GoalSchema = z.object({
  employeeId: z.string().min(1, "Choose an employee."),
  period: z.enum(["MONTHLY", "ANNUAL"]),
  title: z.string().trim().min(5, "Describe the goal (at least 5 characters).").max(120),
  kpi: z.string().trim().min(3, "Name the KPI.").max(80),
  target: z.string().trim().min(1, "Set a target.").max(80),
  due: z.iso.date("Choose a due date."),
});

export async function assignGoal(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = GoalSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { me, ok } = await inTeam(parsed.data.employeeId);
  if (!ok) return { ok: false, message: "You can only set goals for your own team." };
  const { due, ...rest } = parsed.data;
  const g = await db.goal.create({ data: { ...rest, due: new Date(`${due}T00:00:00Z`) }, include: { employee: { select: { name: true } } } });
  await db.notification.create({ data: { employeeId: g.employeeId, type: "goal", message: `${me.name} set you a new goal: ${g.title}.`, link: "/employee/goals" } });
  await audit(me.email, "goal.create", "Goal", g.id, undefined, parsed.data);
  refresh();
  return { ok: true, message: `Goal assigned to ${g.employee.name}. They've been notified.` };
}

const ReviewSchema = z.object({
  employeeId: z.string().min(1, "Choose an employee."),
  period: z.string().trim().min(2, "Name the review period, for example H2 2026.").max(30),
  rating: z.coerce.number().min(1, "Rating is from 1 to 5.").max(5, "Rating is from 1 to 5.").multipleOf(0.5, "Use whole or half points."),
  feedback: z.string().trim().min(10, "Write some feedback (at least 10 characters).").max(1000),
});

export async function addReview(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = ReviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { me, ok } = await inTeam(parsed.data.employeeId);
  if (!ok) return { ok: false, message: "You can only review your own team." };
  const r = await db.review.create({ data: { ...parsed.data, reviewerId: me.employeeId }, include: { employee: { select: { name: true } } } });
  await db.notification.create({ data: { employeeId: r.employeeId, type: "review", message: `${me.name} added your ${r.period} performance review.`, link: "/employee/goals" } });
  await audit(me.email, "review.create", "Review", r.id, undefined, { employeeId: r.employeeId, period: r.period, rating: r.rating });
  refresh();
  return { ok: true, message: `Review saved for ${r.employee.name}.` };
}
