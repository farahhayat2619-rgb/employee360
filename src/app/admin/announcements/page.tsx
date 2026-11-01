import { AnnouncementsManager } from "@/components/comms-views";
import { announcementsAdmin } from "@/lib/comms";

export default async function Page() {
  const data = await announcementsAdmin("admin");
  return <AnnouncementsManager {...data} title="Announcements" subtitle="Company-wide news, holidays and reminders. Everyone in the audience also gets a notification." />;
}
