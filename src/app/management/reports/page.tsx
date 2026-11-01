import { ReportsView } from "@/components/reports";
import { PageHeader } from "@/components/ui";
import { runReport } from "@/lib/reports";

export default async function Page(props: PageProps<"/management/reports">) {
  const data = await runReport("management", (await props.searchParams) as Record<string, string | undefined>);
  return (
    <>
      <PageHeader title="Reports" subtitle={`Reports for the ${data.lockedDept} department from live data. Pick a date range, search, then export to CSV or print to PDF.`} />
      <ReportsView data={data} />
    </>
  );
}
