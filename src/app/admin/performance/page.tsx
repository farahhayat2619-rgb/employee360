import { PerformanceBoard } from "@/components/performance-views";
import { PageHeader } from "@/components/ui";
import { teamPerformance } from "@/lib/performance";

export default async function Page() {
  const data = await teamPerformance("admin");
  return (
    <>
      <PageHeader title="Goals & Performance" subtitle="Goals, progress and review scores across the company." />
      <PerformanceBoard {...data} />
    </>
  );
}
