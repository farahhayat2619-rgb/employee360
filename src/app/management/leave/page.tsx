import { LeaveApprovals } from "@/components/leave-views";
import { PageHeader } from "@/components/ui";
import { requirePortal } from "@/lib/auth";
import { leaveForApproval } from "@/lib/leave";

export default async function Page() {
  const me = await requirePortal("management");
  const { rows } = await leaveForApproval("management");
  return (
    <>
      <PageHeader title="Leave Requests" subtitle={`${me.department} and your direct reports. The employee is notified as soon as you decide.`} />
      <LeaveApprovals rows={rows} />
    </>
  );
}
