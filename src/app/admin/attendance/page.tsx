import { AttendanceMonitor } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Attendance Monitoring" subtitle="All offices. HR can correct a record with a written reason, which is kept in the audit log." />
      <AttendanceMonitor />
    </>
  );
}
