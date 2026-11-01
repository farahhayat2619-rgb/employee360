import { DepartmentEditor } from "@/components/admin-tools";
import { DepartmentsOverview } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";
import { activeEmployeeOptions, departmentSummaries } from "@/lib/queries";

export default async function Page() {
  const [departments, people] = await Promise.all([departmentSummaries("admin"), activeEmployeeOptions()]);
  return (
    <>
      <PageHeader title="Department Management" subtitle="Add departments and set who heads each one." actions={<DepartmentEditor people={people} />} />
      <DepartmentsOverview departments={departments} />
    </>
  );
}
