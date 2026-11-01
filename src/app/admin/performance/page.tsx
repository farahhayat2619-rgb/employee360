import { PerformanceBoard } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Goals & Performance" subtitle="Goals, KPIs and review scores across the company." />
      <PerformanceBoard canAssign />
    </>
  );
}
