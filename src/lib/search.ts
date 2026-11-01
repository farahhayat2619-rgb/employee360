import "server-only";
import type { Role } from "./sample-data";
import { requirePortal } from "./auth";
import { ticketLabel } from "./comms";
import { db } from "./db";
import { navByRole } from "./nav";

export type SearchHit = { title: string; detail: string; href: string };
export type SearchGroup = { label: string; hits: SearchHit[] };

const LIMIT = 8;

/** Searches what the signed-in person is allowed to see in this portal. */
export async function searchEverything(portal: Role, raw: string): Promise<{ q: string; groups: SearchGroup[] }> {
  const me = await requirePortal(portal);
  const q = raw.trim().slice(0, 80);
  if (q.length < 2) return { q, groups: [] };
  const like = { contains: q, mode: "insensitive" as const };

  const pages: SearchHit[] = navByRole[portal]
    .flatMap((g) => g.items.map((i) => ({ title: i.label, detail: `${g.label} · ${portal === "employee" ? "Employee" : portal === "management" ? "Management" : "Admin / HR"} portal`, href: i.href })))
    .filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  const [people, policies, tickets] = await Promise.all([
    portal === "employee"
      ? Promise.resolve([])
      : db.employee.findMany({
          where: {
            OR: [{ name: like }, { id: like }, { designation: like }, { user: { email: like } }],
            // Management sees the same people as on Employee Overview
            ...(portal === "management" ? { status: { not: "INACTIVE" as const } } : {}),
          },
          orderBy: { name: "asc" },
          take: LIMIT,
          select: { id: true, name: true, designation: true, department: { select: { name: true } } },
        }),
    db.policy.findMany({ where: { OR: [{ title: like }, { category: like }, { summary: like }] }, orderBy: { title: "asc" }, take: LIMIT, select: { id: true, title: true, category: true, version: true } }),
    portal === "admin"
      ? Promise.resolve([])
      : db.ticket.findMany({
          where: { OR: [{ id: like }, { subject: like }], ...(portal === "employee" ? { submittedById: me.employeeId } : {}) },
          orderBy: { createdAt: "desc" },
          take: LIMIT,
          select: { id: true, subject: true, status: true, department: true },
        }),
  ]);

  const groups: SearchGroup[] = [
    { label: "Pages", hits: pages },
    {
      label: "Employees",
      hits: people.map((p) => ({ title: p.name, detail: `${p.id} · ${p.designation} · ${p.department.name}`, href: portal === "admin" ? `/admin/employees/new?edit=${p.id}` : "/management/employees" })),
    },
    { label: "Policies", hits: policies.map((p) => ({ title: p.title, detail: `${p.category} · ${p.version}`, href: portal === "admin" ? "/admin/policies" : `/employee/policies#${p.id}` })) },
    {
      label: portal === "employee" ? "My tickets" : "Tickets",
      hits: tickets.map((t) => ({ title: `${t.id} · ${t.subject}`, detail: `${ticketLabel[t.status]} · raised in ${t.department}`, href: portal === "employee" ? "/employee/tickets" : "/management/tickets" })),
    },
  ];
  return { q, groups: groups.filter((g) => g.hits.length) };
}
