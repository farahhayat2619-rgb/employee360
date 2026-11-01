import "server-only";
import { requirePortal, toRole } from "./auth";
import { db } from "./db";
import type { DepartmentSummary, DirectoryEmployee, EditableEmployee, Option, StatusLabel } from "./types";

// Every query authorizes itself, because layouts are not re-run on client-side navigation.

const statusLabel = { ACTIVE: "Active", ON_LEAVE: "On leave", INACTIVE: "Inactive" } as const satisfies Record<string, StatusLabel>;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function listEmployees(portal: "management" | "admin"): Promise<DirectoryEmployee[]> {
  await requirePortal(portal);
  const rows = await db.employee.findMany({
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      designation: true,
      joiningDate: true,
      status: true,
      user: { select: { email: true, role: true } },
      department: { select: { name: true } },
      office: { select: { name: true } },
      manager: { select: { name: true } },
    },
  });
  return rows.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.user.email,
    department: e.department.name,
    designation: e.designation,
    office: e.office.name,
    joiningDate: isoDate(e.joiningDate),
    status: statusLabel[e.status],
    role: toRole[e.user.role],
    manager: e.manager?.name ?? null,
  }));
}

export async function departmentSummaries(portal: "management" | "admin"): Promise<DepartmentSummary[]> {
  await requirePortal(portal);
  const [depts, att, tickets] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, head: { select: { name: true } }, _count: { select: { employees: { where: { status: { not: "INACTIVE" } } } } } } }),
    // Attendance rate for October 2026, the last full month of data
    db.attendance.groupBy({
      by: ["employeeId", "status"],
      where: { date: { gte: new Date("2026-10-01T00:00:00Z"), lte: new Date("2026-10-31T00:00:00Z") } },
      _count: { _all: true },
    }),
    db.ticket.groupBy({ by: ["forwardedTo"], where: { status: { not: "CLOSED" }, forwardedTo: { not: null } }, _count: { _all: true } }),
  ]);
  const empDept = new Map((await db.employee.findMany({ select: { id: true, departmentId: true } })).map((e) => [e.id, e.departmentId]));
  const tally = new Map<string, { present: number; total: number }>();
  for (const a of att) {
    const d = empDept.get(a.employeeId);
    if (!d) continue;
    const t = tally.get(d) ?? { present: 0, total: 0 };
    t.total += a._count._all;
    if (a.status === "PRESENT" || a.status === "LATE") t.present += a._count._all;
    tally.set(d, t);
  }
  const open = new Map(tickets.map((t) => [t.forwardedTo, t._count._all]));
  return depts.map((d) => {
    const t = tally.get(d.id);
    return {
      id: d.id,
      name: d.name,
      head: d.head?.name ?? null,
      headcount: d._count.employees,
      attendanceRate: t && t.total ? Math.round((t.present / t.total) * 100) : null,
      openTickets: open.get(d.name) ?? 0,
    };
  });
}

export async function employeeFormOptions() {
  await requirePortal("admin");
  const [departments, offices, managers] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.office.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.employee.findMany({ where: { status: { not: "INACTIVE" }, user: { role: { in: ["MANAGEMENT", "ADMIN"] } } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { departments, offices, managers } satisfies Record<string, Option[]>;
}

export async function getEditableEmployee(id: string): Promise<EditableEmployee | null> {
  await requirePortal("admin");
  const e = await db.employee.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, departmentId: true, designation: true, managerId: true, joiningDate: true, officeId: true, type: true, user: { select: { email: true, role: true } }, salary: { select: { basic: true, house: true, transport: true, medical: true } } },
  });
  if (!e) return null;
  return { ...e, email: e.user.email, role: toRole[e.user.role], joiningDate: isoDate(e.joiningDate), salary: e.salary };
}

export async function nextEmployeeId() {
  const ids = await db.employee.findMany({ select: { id: true } });
  return `EMP-${Math.max(1000, ...ids.map((r) => Number(r.id.replace("EMP-", "")) || 0)) + 1}`;
}

export async function activeEmployeeOptions(): Promise<Option[]> {
  await requirePortal("admin");
  return db.employee.findMany({ where: { status: { not: "INACTIVE" } }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}
