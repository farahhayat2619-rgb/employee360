import { EmployeeDirectory } from "@/components/people";
import { PageHeader } from "@/components/ui";
import { requirePortal } from "@/lib/auth";
import { listEmployees } from "@/lib/queries";

export default async function Page() {
  const me = await requirePortal("management");
  const rows = await listEmployees("management");
  const deptNames = [...new Set(rows.map((r) => r.department))].sort();
  return (
    <>
      <PageHeader title="Employee Overview" subtitle={`Showing ${me.department}. Change the department filter to see the whole company.`} />
      <EmployeeDirectory rows={rows} deptNames={deptNames} defaultDept={me.department} />
    </>
  );
}
