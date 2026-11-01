import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { COMPANY } from "@/lib/payroll";
import { payslipPdf } from "@/lib/pdf";
import { isoOf, localDate, localTime, monthLabel } from "@/lib/time";

/** Salary slip as a PDF. Employees get their own published slips; Admin / HR can get any slip. */
export async function GET(_req: Request, ctx: RouteContext<"/api/payslips/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new Response("Please sign in.", { status: 401 });
  const p = await db.payslip.findUnique({
    where: { id },
    include: { employee: { select: { id: true, name: true, designation: true, joiningDate: true, department: { select: { name: true } }, office: { select: { name: true } } } } },
  });
  const allowed = p && (user.role === "admin" || (p.employeeId === user.employeeId && p.published));
  if (!p || !allowed) return new Response("Not found.", { status: 404 }); // same answer either way, so ids can't be probed

  const month = isoOf(p.month).slice(0, 7);
  const now = new Date();
  const bytes = await payslipPdf({
    company: COMPANY,
    month: monthLabel(month),
    employee: {
      id: p.employee.id,
      name: p.employee.name,
      designation: p.employee.designation,
      department: p.employee.department.name,
      office: p.employee.office.name,
      joiningDate: new Date(p.employee.joiningDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    },
    earnings: [
      ["Basic salary", p.basic],
      ["House rent allowance", p.house],
      ["Transport allowance", p.transport],
      ["Medical allowance", p.medical],
    ],
    deductions: [
      ["Income tax", p.tax],
      ["Provident fund", p.providentFund],
      ["Other deductions", p.other],
    ],
    net: p.net,
    generatedAt: `${localDate(now)} ${localTime(now)} (PKT)${p.published ? "" : " - DRAFT, not yet published"}`,
  });
  const file = `Salary-slip-${month}-${p.employee.id}.pdf`;
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "private, no-store" },
  });
}
