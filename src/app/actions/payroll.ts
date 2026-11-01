"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeSlip, payrollOverview } from "@/lib/payroll";
import { dbDate, monthLabel } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

/** Calculates (or recalculates) the draft slips for the month that is due. Published slips are never touched. */
export async function runPayroll(month: string): Promise<ActionResult> {
  const me = await authorize("admin");
  const due = await payrollOverview();
  if (month !== due.runMonth) return { ok: false, message: `The payroll that's due is ${monthLabel(due.runMonth)}. Refresh the page.` };
  if (!due.canRun) return { ok: false, message: `${monthLabel(month)} hasn't started yet.` };

  const first = dbDate(`${month}-01`);
  const structures = await db.salaryStructure.findMany({ where: { employee: { status: { not: "INACTIVE" } } } });
  const published = new Set((await db.payslip.findMany({ where: { month: first, published: true }, select: { employeeId: true } })).map((p) => p.employeeId));
  const todo = structures.filter((s) => !published.has(s.employeeId));

  await db.$transaction([
    // Drafts for people who have since been deactivated are dropped
    db.payslip.deleteMany({ where: { month: first, published: false, employeeId: { notIn: todo.map((s) => s.employeeId) } } }),
    ...todo.map((s) => {
      const slip = computeSlip(s);
      return db.payslip.upsert({ where: { employeeId_month: { employeeId: s.employeeId, month: first } }, create: { employeeId: s.employeeId, month: first, ...slip }, update: slip });
    }),
  ]);
  await audit(me.email, "payroll.run", "Payroll", month, undefined, { slips: todo.length });
  revalidatePath("/admin/payroll");
  return { ok: true, message: `${monthLabel(month)} payroll calculated for ${todo.length} employees. Check the figures, then publish.` };
}

export async function publishPayroll(month: string): Promise<ActionResult> {
  const me = await authorize("admin");
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, message: "Unknown month." };
  const first = dbDate(`${month}-01`);
  const drafts = await db.payslip.findMany({ where: { month: first, published: false }, select: { id: true, employeeId: true } });
  if (!drafts.length) return { ok: false, message: "There are no draft slips to publish. Run payroll first." };
  const label = monthLabel(month);
  await db.$transaction([
    db.payslip.updateMany({ where: { id: { in: drafts.map((d) => d.id) } }, data: { published: true } }),
    db.notification.createMany({ data: drafts.map((d) => ({ employeeId: d.employeeId, type: "payroll", message: `Your salary slip for ${label} is ready.`, link: "/employee/payroll" })) }),
  ]);
  await audit(me.email, "payroll.publish", "Payroll", month, undefined, { slips: drafts.length });
  revalidatePath("/admin/payroll");
  revalidatePath("/employee/payroll");
  return { ok: true, message: `${drafts.length} salary slips for ${label} published. Employees have been notified.` };
}
