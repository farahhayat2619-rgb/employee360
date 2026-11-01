import { ReportsView } from "@/components/reports";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="All ten reports with search, department filter, date range and export." />
      <ReportsView />
    </>
  );
}
