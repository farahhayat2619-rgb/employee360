import { PerformanceBoard } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Performance & Goals" subtitle="Assign monthly and annual goals and follow your team's progress." />
      <PerformanceBoard scopeDept="Operations" canAssign />
    </>
  );
}
