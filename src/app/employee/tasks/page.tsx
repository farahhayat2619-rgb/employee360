import { MyTasks } from "@/components/records-views";
import { myTasks } from "@/lib/records";

export default async function TasksPage() {
  const data = await myTasks();
  return <MyTasks {...data} />;
}
