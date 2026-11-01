import { AnnouncementsManager } from "@/components/comms-views";
import { announcementsAdmin } from "@/lib/comms";

export default async function Page() {
  const data = await announcementsAdmin("management");
  return <AnnouncementsManager {...data} title="Company Announcements" subtitle="Post news to your department or the whole company. Everyone in the audience also gets a notification." />;
}
