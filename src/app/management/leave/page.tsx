import { LeaveApprovals } from "@/components/leave-approvals";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Leave Requests" subtitle="Approve or decline your team's leave. The employee is notified straight away." />
      <LeaveApprovals scopeDept="Operations" />
    </>
  );
}
