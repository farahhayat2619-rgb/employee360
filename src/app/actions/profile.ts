"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_PHOTO_BYTES, sniffImage } from "@/lib/files";
import type { ActionResult } from "@/lib/types";

const Contact = z.object({
  phone: z.string().trim().regex(/^\+?[0-9 ]{10,16}$/, "Enter a phone number like +92 300 555 0000."),
  address: z.string().trim().min(5, "Enter your home address.").max(200),
  emergencyContact: z.string().trim().min(5, "Enter an emergency contact with a phone number.").max(120),
});

/** Employees can change only their own contact details. Everything else is kept by HR. */
export async function updateMyContact(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize();
  const parsed = Contact.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const before = await db.employee.findUniqueOrThrow({ where: { id: me.employeeId }, select: { phone: true, address: true, emergencyContact: true } });
  await db.employee.update({ where: { id: me.employeeId }, data: parsed.data });
  await audit(me.email, "profile.contact", "Employee", me.employeeId, before, parsed.data);
  revalidatePath("/employee/profile");
  return { ok: true, message: "Contact details saved." };
}

export async function updateMyPhoto(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize();
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a photo to upload." };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, message: "That photo is larger than 500 KB. Please choose a smaller one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, message: "Use a JPG, PNG or WebP image." };
  await db.employee.update({ where: { id: me.employeeId }, data: { photoUrl: `data:${kind};base64,${Buffer.from(bytes).toString("base64")}` } });
  revalidatePath("/employee/profile");
  return { ok: true, message: "Photo updated." };
}

export async function removeMyPhoto(): Promise<ActionResult> {
  const me = await authorize();
  await db.employee.update({ where: { id: me.employeeId }, data: { photoUrl: null } });
  revalidatePath("/employee/profile");
  return { ok: true, message: "Photo removed." };
}
