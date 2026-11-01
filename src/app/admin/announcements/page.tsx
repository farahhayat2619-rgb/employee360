import { AnnouncementsManager } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Announcements" subtitle="Company-wide news, holidays and reminders. Each one also appears in employees' notifications." />
      <AnnouncementsManager author="Sana Malik" />
    </>
  );
}
