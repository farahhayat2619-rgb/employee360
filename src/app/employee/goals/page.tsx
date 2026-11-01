import { MyGoals } from "@/components/performance-views";
import { myPerformance } from "@/lib/performance";

export default async function GoalsPage() {
  const data = await myPerformance();
  return <MyGoals {...data} />;
}
