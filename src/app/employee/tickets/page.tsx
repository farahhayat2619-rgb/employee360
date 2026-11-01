import { MyTickets } from "@/components/comms-views";
import { myTickets } from "@/lib/comms";

export default async function Page() {
  return <MyTickets {...await myTickets()} />;
}
