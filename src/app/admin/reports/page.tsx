import { ReportsView } from "@/components/reports";
import { PageHeader } from "@/components/ui";
import { runReport } from "@/lib/reports";

export default async function Page(props: PageProps<"/admin/reports">) {
  const data = await runReport("admin", (await props.searchParams) as Record<string, string | undefined>);
  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Ten reports from live data. Filter by department and date range, search, then export to CSV or print to PDF." />
      <ReportsView data={data} />
    </>
  );
}
