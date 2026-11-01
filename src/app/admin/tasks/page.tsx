import { TaskAdmin } from "@/components/records-views";
import { allTasks } from "@/lib/records";

export default async function AdminTasks() {
  const data = await allTasks();
  return <TaskAdmin {...data} />;
}
