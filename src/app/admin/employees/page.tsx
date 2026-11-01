import { UserPlus } from "lucide-react";
import Link from "next/link";
import { EmployeeDirectory } from "@/components/people";
import { buttonClass, PageHeader } from "@/components/ui";
import { listEmployees } from "@/lib/queries";

export default async function Page() {
  const rows = await listEmployees("admin");
  const deptNames = [...new Set(rows.map((r) => r.department))].sort();
  return (
    <>
      <PageHeader
        title="Employee Records"
        subtitle={`${rows.filter((r) => r.status !== "Inactive").length} active of ${rows.length} employees. Edit records or deactivate leavers.`}
        actions={
          <Link href="/admin/employees/new" className={buttonClass("primary")}>
            <UserPlus className="size-4" /> Register employee
          </Link>
        }
      />
      <EmployeeDirectory rows={rows} deptNames={deptNames} admin />
    </>
  );
}
