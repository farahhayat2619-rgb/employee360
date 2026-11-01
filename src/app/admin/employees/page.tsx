import { UserPlus } from "lucide-react";
import Link from "next/link";
import { EmployeeDirectory } from "@/components/people";
import { buttonClass, PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Employee Records"
        subtitle="Every employee at Crescent Bank. Edit records or deactivate leavers."
        actions={
          <Link href="/admin/employees/new" className={buttonClass("primary")}>
            <UserPlus className="size-4" /> Register employee
          </Link>
        }
      />
      <EmployeeDirectory admin />
    </>
  );
}
