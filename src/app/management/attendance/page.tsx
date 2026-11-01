import { AttendanceMonitor } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Attendance Monitoring" subtitle="Live view of who has punched in today. Tap a status to filter." />
      <AttendanceMonitor />
    </>
  );
}
