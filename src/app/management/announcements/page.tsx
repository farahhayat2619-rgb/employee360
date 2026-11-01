import { AnnouncementsManager } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Company Announcements" subtitle="Post news to your team or the whole company." />
      <AnnouncementsManager author="Imran Siddiqui" />
    </>
  );
}
