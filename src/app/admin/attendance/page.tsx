import { AttendanceMonitor } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";
import { attendanceBoard } from "@/lib/attendance";

export default async function Page(props: PageProps<"/admin/attendance">) {
  const { date } = (await props.searchParams) as { date?: string };
  const board = await attendanceBoard("admin", date);
  return (
    <>
      <PageHeader title="Attendance Monitoring" subtitle="All offices. HR can correct a record with a written reason, which is kept in the audit log." />
      <AttendanceMonitor board={board} basePath="/admin/attendance" canCorrect />
    </>
  );
}
