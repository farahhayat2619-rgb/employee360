import { ReportsView } from "@/components/reports";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Reports for the Operations department. Filter, pick a date range and export." />
      <ReportsView scopeDept="Operations" />
    </>
  );
}
