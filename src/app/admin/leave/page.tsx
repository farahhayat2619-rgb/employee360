import { Tabs } from "@/components/client-ui";
import { AllowancesForm, HolidayCalendar, LeaveApprovals } from "@/components/leave-views";
import { PageHeader } from "@/components/ui";
import { leaveForApproval, leaveSettings } from "@/lib/leave";

export default async function AdminLeave() {
  const [{ rows }, settings] = await Promise.all([leaveForApproval("admin"), leaveSettings()]);
  return (
    <>
      <PageHeader title="Leave Management" subtitle="Approve leave, set yearly allowances and keep the holiday calendar." />
      <Tabs
        tabs={[
          { id: "a", label: "Leave approvals", content: <LeaveApprovals rows={rows} /> },
          { id: "b", label: "Yearly allowances", content: <AllowancesForm year={settings.year} types={settings.types} /> },
          { id: "c", label: "Holiday calendar", content: <HolidayCalendar holidays={settings.holidays} /> },
        ]}
      />
    </>
  );
}
