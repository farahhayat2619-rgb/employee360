"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 09:00.");
const OfficeSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(3, "Enter the office name.").max(80),
    address: z.string().trim().min(5, "Enter the office address.").max(200),
    latitude: z.coerce.number("Enter the latitude.").min(-90, "Latitude must be between -90 and 90.").max(90, "Latitude must be between -90 and 90."),
    longitude: z.coerce.number("Enter the longitude.").min(-180, "Longitude must be between -180 and 180.").max(180, "Longitude must be between -180 and 180."),
    radiusM: z.coerce.number().int().min(50, "The radius must be at least 50 m.").max(500, "The radius can be at most 500 m."),
    workStart: hhmm,
    workEnd: hhmm,
    graceMin: z.coerce.number().int().min(0, "Grace can't be negative.").max(60, "Grace can be at most 60 minutes."),
  })
  .refine((o) => o.workStart < o.workEnd, { message: "Work must end after it starts.", path: ["workEnd"] });

/** Adds or edits an office. The punch-in check reads these values, so changes apply to the next punch. */
export async function saveOffice(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const raw = Object.fromEntries(["id", "name", "address", "latitude", "longitude", "radiusM", "workStart", "workEnd", "graceMin"].map((k) => [k, form.get(k) || undefined]));
  const parsed = OfficeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  const clash = await db.office.findFirst({ where: { name: data.name, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (clash) return { ok: false, message: `There is already an office called ${data.name}.` };

  if (id) {
    const before = await db.office.findUnique({ where: { id } });
    if (!before) return { ok: false, message: "That office no longer exists." };
    await db.office.update({ where: { id }, data });
    await audit(me.email, "office.update", "Office", id, before, data);
  } else {
    const o = await db.office.create({ data });
    await audit(me.email, "office.create", "Office", o.id, undefined, data);
  }
  revalidatePath("/admin/settings");
  return { ok: true, message: `${data.name} saved. Punch-ins there are now checked against a ${data.radiusM} m radius.` };
}
