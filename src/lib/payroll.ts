import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { requirePortal } from "./auth";
import { db } from "./db";
import { dbDate, isoOf, localDate, shiftMonth } from "./time";
import type { SlipView } from "./types";

export const COMPANY = "Crescent Bank";

/** The demo's simplified rule: flat income tax on gross pay and provident fund on basic. Not tax advice. */
export function computeSlip(s: { basic: number; house: number; transport: number; medical: number; taxRatePct: number; providentPct: number }) {
  const gross = s.basic + s.house + s.transport + s.medical;
  const tax = Math.round((gross * s.taxRatePct) / 100);
  const providentFund = Math.round((s.basic * s.providentPct) / 100);
  return { basic: s.basic, house: s.house, transport: s.transport, medical: s.medical, tax, providentFund, other: 0, net: gross - tax - providentFund };
}

const slipSelect = {
  id: true,
  month: true,
  employeeId: true,
  employee: { select: { name: true, department: { select: { name: true } } } },
  basic: true,
  house: true,
  transport: true,
  medical: true,
  tax: true,
  providentFund: true,
  other: true,
  net: true,
  published: true,
} satisfies Prisma.PayslipSelect;

export function toSlipView(p: Prisma.PayslipGetPayload<{ select: typeof slipSelect }>): SlipView {
  const gross = p.basic + p.house + p.transport + p.medical;
  return {
    id: p.id,
    month: isoOf(p.month).slice(0, 7),
    employeeId: p.employeeId,
    employee: p.employee.name,
    department: p.employee.department.name,
    basic: p.basic,
    house: p.house,
    transport: p.transport,
    medical: p.medical,
    tax: p.tax,
    providentFund: p.providentFund,
    other: p.other,
    gross,
    deductions: p.tax + p.providentFund + p.other,
    net: p.net,
    published: p.published,
  };
}

/** The signed-in person's published salary slips, newest first. */
export async function mySlips() {
  const me = await requirePortal("employee");
  const rows = await db.payslip.findMany({ where: { employeeId: me.employeeId, published: true }, orderBy: { month: "desc" }, select: slipSelect });
  return rows.map(toSlipView);
}

/**
 * Which month HR should run next: the latest month that has unpublished slips, otherwise the month after
 * the last published run, but never a month that hasn't started yet.
 */
async function nextRunMonth(thisMonth: string) {
  const latest = await db.payslip.findFirst({ orderBy: { month: "desc" }, select: { month: true } });
  if (!latest) return thisMonth;
  const m = isoOf(latest.month).slice(0, 7);
  const draft = await db.payslip.count({ where: { month: latest.month, published: false } });
  if (draft) return m;
  return shiftMonth(m, 1);
}

export async function payrollOverview() {
  await requirePortal("admin");
  const thisMonth = localDate(new Date()).slice(0, 7);
  const runMonth = await nextRunMonth(thisMonth);
  const canRun = runMonth <= thisMonth;

  const [slips, structures, history] = await Promise.all([
    db.payslip.findMany({ where: { month: dbDate(`${runMonth}-01`) }, orderBy: { employee: { name: "asc" } }, select: slipSelect }),
    db.salaryStructure.findMany({ where: { employee: { status: { not: "INACTIVE" } } }, include: { employee: { select: { name: true, department: { select: { name: true } } } } }, orderBy: { employee: { name: "asc" } } }),
    db.payslip.groupBy({ by: ["month", "published"], _count: { _all: true }, _sum: { net: true }, orderBy: { month: "desc" } }),
  ]);

  // Before the run, show what each slip would be from the current salary structures
  const preview: SlipView[] = structures.map((s) => {
    const c = computeSlip(s);
    const gross = c.basic + c.house + c.transport + c.medical;
    return { id: `preview-${s.employeeId}`, month: runMonth, employeeId: s.employeeId, employee: s.employee.name, department: s.employee.department.name, ...c, gross, deductions: c.tax + c.providentFund, published: false };
  });

  const months = new Map<string, { month: string; count: number; net: number; published: boolean }>();
  for (const h of history) {
    const m = isoOf(h.month).slice(0, 7);
    const cur = months.get(m) ?? { month: m, count: 0, net: 0, published: true };
    cur.count += h._count._all;
    cur.net += h._sum.net ?? 0;
    if (!h.published) cur.published = false;
    months.set(m, cur);
  }

  return {
    runMonth,
    canRun,
    stage: slips.length ? ("processed" as const) : ("draft" as const),
    rows: slips.length ? slips.map(toSlipView) : preview,
    history: [...months.values()].filter((h) => h.published),
  };
}

/** One published month, for the salary records tab. */
export async function payrollMonth(month: string) {
  await requirePortal("admin");
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const rows = await db.payslip.findMany({ where: { month: dbDate(`${month}-01`) }, orderBy: { employee: { name: "asc" } }, select: slipSelect });
  return rows.map(toSlipView);
}
