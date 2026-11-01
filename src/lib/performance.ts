import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { requirePortal, type CurrentUser } from "./auth";
import { db } from "./db";
import { isoOf, localDate } from "./time";
import type { GoalView, ReviewView, TeamMemberPerf } from "./types";

const toGoal = (g: { id: string; employeeId: string; period: "MONTHLY" | "ANNUAL"; title: string; kpi: string; target: string; progress: number; due: Date }): GoalView => ({
  id: g.id,
  employeeId: g.employeeId,
  period: g.period === "MONTHLY" ? "Monthly" : "Annual",
  title: g.title,
  kpi: g.kpi,
  target: g.target,
  progress: g.progress,
  due: isoOf(g.due),
});

export async function myPerformance() {
  const me = await requirePortal("employee");
  const [goals, reviews, emp] = await Promise.all([
    db.goal.findMany({ where: { employeeId: me.employeeId }, orderBy: [{ due: "asc" }, { createdAt: "asc" }] }),
    db.review.findMany({ where: { employeeId: me.employeeId }, orderBy: { createdAt: "desc" }, include: { reviewer: { select: { name: true } } } }),
    db.employee.findUniqueOrThrow({ where: { id: me.employeeId }, select: { manager: { select: { name: true } } } }),
  ]);
  return {
    today: localDate(new Date()),
    manager: emp.manager?.name ?? null,
    goals: goals.map(toGoal),
    reviews: reviews.map((r): ReviewView => ({ id: r.id, period: r.period, rating: r.rating, feedback: r.feedback, reviewer: r.reviewer.name, date: isoOf(r.createdAt) })),
  };
}

/** Who a manager or HR may set goals for and review. Management: their department and direct reports. */
export function teamScope(me: CurrentUser): Prisma.EmployeeWhereInput {
  const base: Prisma.EmployeeWhereInput = { status: { not: "INACTIVE" }, id: { not: me.employeeId } };
  return me.role === "admin" ? base : { ...base, OR: [{ departmentId: me.departmentId }, { managerId: me.employeeId }] };
}

export async function teamPerformance(portal: "management" | "admin") {
  const me = await requirePortal(portal);
  const team = await db.employee.findMany({
    where: teamScope(me),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      designation: true,
      department: { select: { name: true } },
      goals: { select: { progress: true } },
      reviewsGot: { orderBy: { createdAt: "desc" }, take: 1, select: { rating: true, period: true } },
    },
  });
  const rows: TeamMemberPerf[] = team.map((e) => ({
    id: e.id,
    name: e.name,
    designation: e.designation,
    department: e.department.name,
    goals: e.goals.length,
    avgProgress: e.goals.length ? Math.round(e.goals.reduce((s, g) => s + g.progress, 0) / e.goals.length) : null,
    rating: e.reviewsGot[0]?.rating ?? null,
    ratingPeriod: e.reviewsGot[0]?.period ?? null,
  }));
  return { rows, scopeDept: portal === "management" ? me.department : null, today: localDate(new Date()) };
}
