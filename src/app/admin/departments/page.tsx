import { DepartmentsOverview } from "@/components/monitoring";
import { DepartmentEditor } from "@/components/admin-tools";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Department Management" subtitle="Add departments and set who heads each one." actions={<DepartmentEditor />} />
      <DepartmentsOverview />
    </>
  );
}
