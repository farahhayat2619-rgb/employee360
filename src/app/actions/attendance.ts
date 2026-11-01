"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { distanceMetres, MAX_ACCURACY_M } from "@/lib/geo";
import { dbDate, localDate, localTime, minutesOf } from "@/lib/time";
import type { ActionResult, PunchResult } from "@/lib/types";

const Fix = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(100_000),
});

/**
 * Punch In / Out. The browser only sends the raw GPS reading; the distance check, the clock and the
 * late / early decisions all happen here, so a modified page can't mark attendance from elsewhere
 * by skipping the check or changing the time.
 */
export async function punch(kind: "in" | "out", fix: unknown): Promise<PunchResult> {
  const me = await authorize(); // any signed-in person punches for themselves
  const parsed = Fix.safeParse(fix);
  if (!parsed.success || (kind !== "in" && kind !== "out")) return { ok: false, reason: "invalid", message: "We didn't receive a valid location. Please try again." };
  const { lat, lng, accuracy } = parsed.data;

  const emp = await db.employee.findUnique({ where: { id: me.employeeId }, select: { status: true, office: true } });
  if (!emp || emp.status === "INACTIVE") return { ok: false, reason: "state", message: "Your account is not active. Please contact HR." };
  const office = emp.office;

  const acc = Math.round(accuracy);
  if (acc > MAX_ACCURACY_M) {
    return { ok: false, reason: "accuracy", message: `Your location is too imprecise (about ${acc} m). Turn on precise location and try again near a window.` };
  }
  const dist = Math.round(distanceMetres({ lat, lng }, { lat: office.latitude, lng: office.longitude }));
  if (dist > office.radiusM) {
    return { ok: false, reason: "outside", message: "You're outside the authorized office location. Attendance cannot be marked.", distance: dist, office: office.name };
  }

  const now = new Date();
  const today = localDate(now);
  const nowMin = minutesOf(localTime(now));
  const key = { employeeId_date: { employeeId: me.employeeId, date: dbDate(today) } };
  const existing = await db.attendance.findUnique({ where: key });

  if (kind === "in") {
    if (existing?.punchInAt) return { ok: false, reason: "state", message: `You already punched in today at ${localTime(existing.punchInAt)}.` };
    if (existing?.status === "ON_LEAVE") return { ok: false, reason: "state", message: "You're on approved leave today. Ask your manager to cancel the leave first if you're working." };
    const late = nowMin > minutesOf(office.workStart) + office.graceMin;
    const data = { punchInAt: now, punchInLat: lat, punchInLng: lng, punchInDistM: dist, punchInAccM: acc, officeName: office.name, status: late ? ("LATE" as const) : ("PRESENT" as const), late, gpsVerified: true };
    await db.attendance.upsert({ where: key, create: { employeeId: me.employeeId, date: dbDate(today), ...data }, update: data });
    revalidatePath("/employee");
    return { ok: true, message: late ? `Punched in at ${localTime(now)}. This is marked late (after ${office.workStart} + ${office.graceMin} min).` : `Punched in at ${localTime(now)}. Have a good day!` };
  }

  if (!existing?.punchInAt) return { ok: false, reason: "state", message: "You haven't punched in today, so there's nothing to punch out of." };
  if (existing.punchOutAt) return { ok: false, reason: "state", message: `You already punched out today at ${localTime(existing.punchOutAt)}.` };
  const minutesWorked = Math.max(0, Math.round((now.getTime() - existing.punchInAt.getTime()) / 60_000));
  const earlyLeave = nowMin < minutesOf(office.workEnd);
  // Updates only if still not punched out, so two taps can't both write
  const res = await db.attendance.updateMany({
    where: { id: existing.id, punchOutAt: null },
    data: { punchOutAt: now, punchOutLat: lat, punchOutLng: lng, punchOutDistM: dist, punchOutAccM: acc, minutesWorked, earlyLeave },
  });
  if (res.count === 0) return { ok: false, reason: "state", message: "You already punched out today." };
  revalidatePath("/employee");
  const h = `${Math.floor(minutesWorked / 60)} h ${minutesWorked % 60} min`;
  return { ok: true, message: `Punched out at ${localTime(now)} after ${h}.${earlyLeave ? ` That's before ${office.workEnd}, so it's marked as an early departure.` : ""}` };
}

const Correction = z.object({
  employeeId: z.string().min(1),
  date: z.iso.date(),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "ON_LEAVE"]),
  note: z.string().trim().min(5, "Write the reason for the correction (at least 5 characters).").max(300),
});

/** HR correction. Kept separate from GPS punches: a corrected day is never shown as GPS-verified. */
export async function correctAttendance(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await authorize("admin");
  const parsed = Correction.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { employeeId, date, status, note } = parsed.data;
  if (date > localDate(new Date())) return { ok: false, message: "You can't correct a day that hasn't happened yet." };
  const emp = await db.employee.findUnique({ where: { id: employeeId }, select: { name: true } });
  if (!emp) return { ok: false, message: "That employee no longer exists." };
  const key = { employeeId_date: { employeeId, date: dbDate(date) } };
  const before = await db.attendance.findUnique({ where: key, select: { status: true, late: true, gpsVerified: true } });
  const data = { status, late: status === "LATE", gpsVerified: false, correctedBy: me.email, correctionNote: note };
  await db.attendance.upsert({ where: key, create: { employeeId, date: dbDate(date), ...data }, update: data });
  await audit(me.email, "attendance.correct", "Attendance", `${employeeId}@${date}`, before ?? undefined, { status, note });
  revalidatePath("/admin/attendance");
  return { ok: true, message: `${emp.name}'s attendance on ${new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} was corrected. The change is in the audit log.` };
}
