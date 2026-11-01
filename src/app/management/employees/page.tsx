import { EmployeeDirectory } from "@/components/people";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Employee Overview" subtitle="Your team in Operations. Switch the department filter to see the whole company." />
      <EmployeeDirectory scopeDept="Operations" />
    </>
  );
}
