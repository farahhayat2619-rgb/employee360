import { HelpdeskAdmin } from "@/components/comms-views";
import { requirePortal } from "@/lib/auth";
import { allHelpdesk } from "@/lib/comms";

export default async function Page() {
  const [me, requests] = await Promise.all([requirePortal("admin"), allHelpdesk()]);
  return <HelpdeskAdmin requests={requests} meId={me.employeeId} />;
}
