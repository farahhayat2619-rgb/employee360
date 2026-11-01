import "server-only";
import { requirePortal } from "./auth";
import { db } from "./db";
import { isoOf } from "./time";

export async function myProfile() {
  const me = await requirePortal("employee");
  const e = await db.employee.findUniqueOrThrow({
    where: { id: me.employeeId },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      emergencyContact: true,
      photoUrl: true,
      designation: true,
      joiningDate: true,
      type: true,
      status: true,
      updatedAt: true,
      user: { select: { email: true } },
      department: { select: { name: true } },
      office: { select: { name: true, workStart: true, workEnd: true } },
      manager: { select: { name: true } },
    },
  });
  return {
    id: e.id,
    name: e.name,
    email: e.user.email,
    phone: e.phone,
    address: e.address ?? "",
    emergencyContact: e.emergencyContact ?? "",
    photo: e.photoUrl ? `/api/photos/${e.id}?v=${e.updatedAt.getTime()}` : null,
    designation: e.designation,
    department: e.department.name,
    office: e.office.name,
    hours: `${e.office.workStart} – ${e.office.workEnd}, Monday to Friday`,
    manager: e.manager?.name ?? "None",
    joiningDate: isoOf(e.joiningDate),
    type: e.type === "PERMANENT" ? "Permanent" : "Contract",
    status: e.status === "ACTIVE" ? "Active" : e.status === "ON_LEAVE" ? "On leave" : "Inactive",
  };
}
export type MyProfile = Awaited<ReturnType<typeof myProfile>>;
