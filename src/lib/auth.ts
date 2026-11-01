import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role as DbRole } from "@/generated/prisma/client";
import { db } from "./db";
import type { Role } from "./sample-data";
import { readSession } from "./session";

// Data Access Layer: the only place that turns a cookie into a user. Every page and
// server action authorizes through these helpers, never through anything the browser sends.

export const toRole: Record<DbRole, Role> = { EMPLOYEE: "employee", MANAGEMENT: "management", ADMIN: "admin" };

/** Which portals each role may open. HR/Admin can see everything; managers get their portal and their own workspace. */
export const portalsFor: Record<Role, Role[]> = {
  employee: ["employee"],
  management: ["management", "employee"],
  admin: ["admin", "management", "employee"],
};

export type CurrentUser = {
  userId: string;
  email: string;
  role: Role;
  portals: Role[];
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  departmentId: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, active: true, employee: { select: { id: true, name: true, designation: true, departmentId: true, department: { select: { name: true } } } } },
  });
  if (!user || !user.active || !user.employee) return null;
  const role = toRole[user.role];
  return {
    userId: user.id,
    email: user.email,
    role,
    portals: portalsFor[role],
    employeeId: user.employee.id,
    name: user.employee.name,
    designation: user.employee.designation,
    department: user.employee.department.name,
    departmentId: user.employee.departmentId,
  };
});

/** For pages and layouts: sends signed-out visitors to the login page and others to a portal they may use. */
export async function requirePortal(portal: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/?signin=required");
  if (!user.portals.includes(portal)) redirect(`/${user.role}?denied=${portal}`);
  return user;
}

/** For server actions: throws instead of redirecting so a forged request gets an error, not a page. */
export async function authorize(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Your session has ended. Please sign in again.");
  if (roles.length && !roles.includes(user.role)) throw new Error("You don't have permission to do that.");
  return user;
}
