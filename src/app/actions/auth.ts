"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { portalsFor, toRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/sample-data";
import { createSession, destroySession } from "@/lib/session";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid work email.")),
  password: z.string().min(1, "Enter your password.").max(200),
  portal: z.enum(["employee", "management", "admin"]),
});

export type LoginState = { error?: string; email?: string } | undefined;

const WINDOW_MIN = 15;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 25;
// Compared against when the email is unknown, so response time doesn't reveal which emails exist
const DUMMY_HASH = "$2b$12$.KMtGYVu2WdtlfrzGInVE.uzaYUXtXsGLeQdw3z2XZzQB0cfBrqpK";

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({ email: form.get("email"), password: form.get("password"), portal: form.get("portal") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: String(form.get("email") ?? "") };
  const { email, password, portal } = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const [byEmail, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
  ]);
  if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) {
    return { error: `Too many failed attempts. Please wait ${WINDOW_MIN} minutes and try again, or contact HR.`, email };
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, role: true, active: true } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  await db.loginAttempt.create({ data: { email, ip, success: !!(user && ok && user.active) } });

  if (!user || !ok) return { error: "That email and password don't match. Check them and try again.", email };
  if (!user.active) return { error: "This account has been deactivated. Please contact HR.", email };

  const role = toRole[user.role];
  if (!portalsFor[role].includes(portal as Role)) {
    return { error: `Your account doesn't have access to the ${portal === "admin" ? "Admin / HR" : "Management"} portal. Choose the ${role === "employee" ? "Employee" : "Management"} portal instead.`, email };
  }

  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  redirect(`/${portal}`);
}

export async function logout() {
  await destroySession();
  redirect("/?signedout=1");
}
