import { NotificationCenter } from "@/components/comms-views";
import { myAnnouncements, myNotifications } from "@/lib/comms";

export default async function Page(props: PageProps<"/employee/notifications">) {
  const { tab } = (await props.searchParams) as { tab?: string };
  const [{ notifications, today }, announcements] = await Promise.all([myNotifications(), myAnnouncements()]);
  return <NotificationCenter key={tab ?? "n"} notifications={notifications} announcements={announcements} today={today} initialTab={tab} />;
}
