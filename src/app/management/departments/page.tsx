import { DepartmentsOverview } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Department Overview" subtitle="Headcount, attendance and open tickets for each department." />
      <DepartmentsOverview />
    </>
  );
}
