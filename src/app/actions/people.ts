"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role as DbRole } from "@/generated/prisma/client";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextEmployeeId } from "@/lib/queries";
import type { ActionResult } from "@/lib/types";

const dbRole: Record<string, DbRole> = { employee: "EMPLOYEE", management: "MANAGEMENT", admin: "ADMIN" };
const money = z.coerce.number().int("Use whole rupees.").min(0, "Amounts can't be negative.").max(10_000_000, "That amount looks too large.");

const EmployeeSchema = z.object({
  id: z.string().regex(/^EMP-\d{4,6}$/).optional(),
  name: z.string().trim().min(3, "Enter the full name.").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid work email.")),
  phone: z.string().trim().regex(/^\+?[0-9 ]{10,16}$/, "Enter a phone number like +92 300 555 0000."),
  departmentId: z.string().min(1, "Choose a department."),
  designation: z.string().trim().min(2, "Enter a designation.").max(80),
  managerId: z.string().optional().transform((v) => v || null),
  joiningDate: z.iso.date("Enter the joining date."),
  officeId: z.string().min(1, "Choose an office."),
  type: z.enum(["PERMANENT", "CONTRACT"]),
  role: z.enum(["employee", "management", "admin"]),
  basic: money,
  house: money,
  transport: money,
  medical: money,
});

// Readable one-time password: no look-alike characters
function tempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[randomInt(chars.length)]).join("");
}

async function audit(actorEmail: string, action: string, entity: string, entityId: string, before?: unknown, after?: unknown) {
  await db.auditLog.create({ data: { actorEmail, action, entity, entityId, before: before === undefined ? undefined : JSON.parse(JSON.stringify(before)), after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)) } });
}

export async function saveEmployee(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const parsed = EmployeeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.managerId && d.managerId === d.id) return { ok: false, message: "An employee can't report to themselves." };

  const emailOwner = await db.user.findUnique({ where: { email: d.email }, select: { employee: { select: { id: true } } } });
  if (emailOwner && emailOwner.employee?.id !== d.id) return { ok: false, message: "Another account already uses that email." };

  const profile = { name: d.name, phone: d.phone, departmentId: d.departmentId, designation: d.designation, managerId: d.managerId, joiningDate: new Date(`${d.joiningDate}T00:00:00Z`), officeId: d.officeId, type: d.type };
  const salary = { basic: d.basic, house: d.house, transport: d.transport, medical: d.medical };

  if (d.id) {
    const before = await db.employee.findUnique({ where: { id: d.id }, include: { user: { select: { email: true, role: true } }, salary: true } });
    if (!before) return { ok: false, message: "That employee no longer exists." };
    if (before.userId === me.userId && dbRole[d.role] !== before.user.role) return { ok: false, message: "You can't change your own role. Ask another HR admin." };
    await db.$transaction([
      db.employee.update({ where: { id: d.id }, data: profile }),
      db.user.update({ where: { id: before.userId }, data: { email: d.email, role: dbRole[d.role] } }),
      db.salaryStructure.upsert({ where: { employeeId: d.id }, create: { employeeId: d.id, ...salary }, update: salary }),
    ]);
    await audit(me.email, "employee.update", "Employee", d.id, { ...before, user: before.user }, { ...profile, email: d.email, role: d.role, salary });
    revalidatePath("/admin/employees");
    return { ok: true, message: `${d.name}'s record was updated.` };
  }

  const id = await nextEmployeeId();
  const password = tempPassword();
  const year = new Date().getUTCFullYear();
  const leaveTypes = await db.leaveType.findMany();
  await db.user.create({
    data: {
      email: d.email,
      passwordHash: await bcrypt.hash(password, 12),
      role: dbRole[d.role],
      employee: {
        create: {
          id,
          ...profile,
          salary: { create: salary },
          leaveBalances: { create: leaveTypes.map((t) => ({ leaveTypeId: t.id, year, allowed: t.daysPerYear })) },
        },
      },
    },
  });
  await audit(me.email, "employee.create", "Employee", id, undefined, { ...profile, email: d.email, role: d.role, salary });
  revalidatePath("/admin/employees");
  return { ok: true, message: `${d.name} was registered as ${id}.`, tempPassword: password };
}

export async function setEmployeeActive(employeeId: string, active: boolean): Promise<ActionResult> {
  const me = await authorize("admin");
  const e = await db.employee.findUnique({ where: { id: employeeId }, select: { name: true, userId: true, status: true } });
  if (!e) return { ok: false, message: "That employee no longer exists." };
  if (e.userId === me.userId) return { ok: false, message: "You can't deactivate your own account." };
  await db.$transaction([
    db.employee.update({ where: { id: employeeId }, data: { status: active ? "ACTIVE" : "INACTIVE" } }),
    db.user.update({ where: { id: e.userId }, data: { active } }),
    ...(active ? [] : [db.session.deleteMany({ where: { userId: e.userId } })]), // sign them out everywhere
  ]);
  await audit(me.email, active ? "employee.reactivate" : "employee.deactivate", "Employee", employeeId, { status: e.status }, { status: active ? "ACTIVE" : "INACTIVE" });
  revalidatePath("/admin/employees");
  return { ok: true, message: active ? `${e.name} can sign in again.` : `${e.name} was deactivated and signed out.` };
}

export async function setRole(employeeId: string, role: string): Promise<ActionResult> {
  const me = await authorize("admin");
  const r = z.enum(["employee", "management", "admin"]).safeParse(role);
  if (!r.success) return { ok: false, message: "Unknown role." };
  const e = await db.employee.findUnique({ where: { id: employeeId }, select: { name: true, userId: true, user: { select: { role: true } } } });
  if (!e) return { ok: false, message: "That employee no longer exists." };
  if (e.userId === me.userId) return { ok: false, message: "You can't change your own role. Ask another HR admin." };
  await db.user.update({ where: { id: e.userId }, data: { role: dbRole[r.data] } });
  await audit(me.email, "user.role", "Employee", employeeId, { role: e.user.role }, { role: dbRole[r.data] });
  revalidatePath("/admin/roles");
  const label = { employee: "Employee", management: "Management", admin: "Admin / HR" }[r.data];
  return { ok: true, message: `${e.name} is now ${label}.` };
}

const DepartmentSchema = z.object({
  name: z.string().trim().min(2, "Enter a department name.").max(60),
  headId: z.string().optional().transform((v) => v || null),
  description: z.string().trim().max(300).optional(),
});

export async function createDepartment(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const parsed = DepartmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { name, headId, description } = parsed.data;
  if (await db.department.findUnique({ where: { name } })) return { ok: false, message: `There is already a ${name} department.` };
  if (headId && (await db.department.findUnique({ where: { headId } }))) return { ok: false, message: "That person already heads another department." };
  const dept = await db.department.create({ data: { name, headId, description } });
  await audit(me.email, "department.create", "Department", dept.id, undefined, { name, headId });
  revalidatePath("/admin/departments");
  return { ok: true, message: `${name} department created.` };
}
