import { MyHelpdesk } from "@/components/comms-views";
import { myHelpdesk } from "@/lib/comms";

export default async function Page() {
  return <MyHelpdesk requests={await myHelpdesk()} />;
}
