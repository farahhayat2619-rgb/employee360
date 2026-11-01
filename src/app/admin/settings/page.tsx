import { SettingsView } from "@/components/settings-view";
import { requirePortal } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  await requirePortal("admin");
  const offices = await db.office.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { employees: { where: { status: { not: "INACTIVE" } } } } } } });
  return (
    <SettingsView
      offices={offices.map((o) => ({ id: o.id, name: o.name, address: o.address, latitude: o.latitude, longitude: o.longitude, radiusM: o.radiusM, workStart: o.workStart, workEnd: o.workEnd, graceMin: o.graceMin, staff: o._count.employees }))}
    />
  );
}
