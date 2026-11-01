import { DepartmentsOverview } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";
import { departmentSummaries } from "@/lib/queries";

export default async function Page() {
  const departments = await departmentSummaries("management");
  return (
    <>
      <PageHeader title="Department Overview" subtitle="Headcount, October attendance and open tickets for each department." />
      <DepartmentsOverview departments={departments} />
    </>
  );
}
