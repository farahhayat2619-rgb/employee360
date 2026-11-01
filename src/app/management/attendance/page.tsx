import { AttendanceMonitor } from "@/components/monitoring";
import { PageHeader } from "@/components/ui";
import { attendanceBoard } from "@/lib/attendance";

export default async function Page(props: PageProps<"/management/attendance">) {
  const { date } = (await props.searchParams) as { date?: string };
  const board = await attendanceBoard("management", date);
  return (
    <>
      <PageHeader title="Attendance Monitoring" subtitle="Who has punched in, from where, and when. Tap a status to filter." />
      <AttendanceMonitor board={board} basePath="/management/attendance" />
    </>
  );
}
