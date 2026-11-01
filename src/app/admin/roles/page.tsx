"use client";

import { Check, Minus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/client-ui";
import { Avatar, Card, DataTable, PageHeader } from "@/components/ui";
import { employees as seed, type Role } from "@/lib/sample-data";

const matrix: { area: string; employee: string; management: string; admin: string }[] = [
  { area: "Own attendance, leave, payslips, goals", employee: "Own", management: "Own", admin: "Own" },
  { area: "Team attendance and leave approvals", employee: "—", management: "Department", admin: "All" },
  { area: "Employee records", employee: "—", management: "View department", admin: "Full" },
  { area: "Payroll and salary records", employee: "Own slips", management: "—", admin: "Full" },
  { area: "Goals and reviews", employee: "Own", management: "Department", admin: "All" },
  { area: "Complaint tickets", employee: "Submit, track own", management: "Review, forward, track", admin: "View reports" },
  { area: "Department inbox", employee: "When forwarded", management: "When forwarded", admin: "When forwarded" },
  { area: "Policies", employee: "Read", management: "Read", admin: "Manage" },
  { area: "Announcements", employee: "Read", management: "Post", admin: "Post" },
  { area: "Reports", employee: "—", management: "Department", admin: "All" },
  { area: "Roles, offices and settings", employee: "—", management: "—", admin: "Full" },
];

const cell = (v: string) => (v === "—" ? <Minus className="size-4 text-ink-faint" /> : <span className="flex items-center gap-1.5"><Check className="size-4 text-good" />{v}</span>);

export default function RolesPage() {
  const [list, setList] = useState(seed);
  const { show, toast } = useToast();
  return (
    <>
      <PageHeader title="Roles & Permissions" subtitle="Each person has one portal role. Every page and API call checks it on the server." />
      <Card title="What each role can access" pad={false} className="mb-6">
        <DataTable
          rows={matrix}
          rowKey={(m) => m.area}
          columns={[
            { key: "a", header: "Area", cell: (m) => <span className="font-medium text-navy-900">{m.area}</span> },
            { key: "e", header: "Employee", cell: (m) => cell(m.employee) },
            { key: "m", header: "Management", cell: (m) => cell(m.management) },
            { key: "h", header: "Admin / HR", cell: (m) => cell(m.admin) },
          ]}
        />
      </Card>
      <Card title="User roles" pad={false}>
        <DataTable
          rows={list}
          rowKey={(e) => e.id}
          columns={[
            { key: "n", header: "User", cell: (e) => <span className="flex items-center gap-3"><Avatar name={e.name} size="sm" /><span><span className="block font-medium text-navy-900">{e.name}</span><span className="text-xs text-ink-faint">{e.email}</span></span></span> },
            { key: "d", header: "Department", cell: (e) => e.department },
            {
              key: "r",
              header: "Role",
              cell: (e) => (
                <select
                  value={e.role}
                  onChange={(ev) => {
                    const role = ev.target.value as Role;
                    setList((l) => l.map((x) => (x.id === e.id ? { ...x, role } : x)));
                    show(`${e.name} is now ${role === "admin" ? "Admin / HR" : role === "management" ? "Management" : "Employee"}. Logged in audit trail.`);
                  }}
                  className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
                  aria-label={`Role for ${e.name}`}
                >
                  <option value="employee">Employee</option>
                  <option value="management">Management</option>
                  <option value="admin">Admin / HR</option>
                </select>
              ),
            },
          ]}
        />
      </Card>
      {toast}
    </>
  );
}
