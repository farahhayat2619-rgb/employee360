import { MyLeave } from "@/components/leave-views";
import { myLeave } from "@/lib/leave";

export default async function LeavePage() {
  const data = await myLeave();
  return <MyLeave {...data} />;
}
