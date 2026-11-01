import { Check, Minus } from "lucide-react";
import { RoleTable } from "@/components/role-table";
import { Card, DataTable, PageHeader } from "@/components/ui";
import { requirePortal } from "@/lib/auth";
import { listEmployees } from "@/lib/queries";

const matrix: { area: string; employee: string; management: string; admin: string }[] = [
  { area: "Own attendance, leave, payslips, goals", employee: "Own", management: "Own", admin: "Own" },
  { area: "Team attendance and leave approvals", employee: "—", management: "Department", admin: "All" },
  { area: "Employee records", employee: "—", management: "View department", admin: "Full" },
  { area: "Payroll and salary records", employee: "Own slips", management: "—", admin: "Full" },
  { area: "Goals and reviews", employee: "Own", management: "Department", admin: "All" },
  { area: "Complaint tickets", employee: "Submit, track own", management: "Review, forward, track", admin: "View reports" },
  { area: "Department inbox", employee: "When forwarded", management: "When forwarded", admin: "When forwarded" },
  { area: "Policies", employee: "Read", management: "Read", admin: "Manage" },
  { area: "Announcements", employee: "Read", management: "Post", admin: "Post" },
  { area: "Reports", employee: "—", management: "Department", admin: "All" },
  { area: "Roles, offices and settings", employee: "—", management: "—", admin: "Full" },
];

const cell = (v: string) => (v === "—" ? <Minus className="size-4 text-ink-faint" /> : <span className="flex items-center gap-1.5"><Check className="size-4 text-good" />{v}</span>);

export default async function RolesPage() {
  const me = await requirePortal("admin");
  const rows = await listEmployees("admin");
  const deptNames = [...new Set(rows.map((r) => r.department))].sort();
  return (
    <>
      <PageHeader title="Roles & Permissions" subtitle="Each person has one portal role. Every page and server action checks it on the server, and every change is written to the audit log." />
      <Card title="What each role can access" pad={false} className="mb-6">
        <DataTable
          rows={matrix}
          rowKey={(m) => m.area}
          columns={[
            { key: "a", header: "Area", cell: (m) => <span className="font-medium text-navy-900">{m.area}</span> },
            { key: "e", header: "Employee", cell: (m) => cell(m.employee) },
            { key: "m", header: "Management", cell: (m) => cell(m.management) },
            { key: "h", header: "Admin / HR", cell: (m) => cell(m.admin) },
          ]}
        />
      </Card>
      <RoleTable rows={rows} deptNames={deptNames} myId={me.employeeId} />
    </>
  );
}
