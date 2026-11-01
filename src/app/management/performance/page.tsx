import { PerformanceBoard } from "@/components/performance-views";
import { PageHeader } from "@/components/ui";
import { teamPerformance } from "@/lib/performance";

export default async function Page() {
  const data = await teamPerformance("management");
  return (
    <>
      <PageHeader title="Performance & Goals" subtitle="Assign monthly and annual goals, follow your team's progress and write reviews." />
      <PerformanceBoard {...data} />
    </>
  );
}
