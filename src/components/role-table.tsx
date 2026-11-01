"use client";

import { useState, useTransition } from "react";
import { setRole } from "@/app/actions/people";
import type { Role } from "@/lib/sample-data";
import type { DirectoryEmployee } from "@/lib/types";
import { useToast } from "./client-ui";
import { Filters } from "./people";
import { Avatar, Card, DataTable } from "./ui";

export function RoleTable({ rows, deptNames, myId }: { rows: DirectoryEmployee[]; deptNames: string[]; myId: string | null }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [pending, start] = useTransition();
  const { show, toast } = useToast();
  const shown = rows.filter((e) => (dept === "All" || e.department === dept) && (e.name.toLowerCase().includes(q.toLowerCase()) || e.email.includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase())));

  return (
    <Card title="User roles" pad={false}>
      <Filters q={q} setQ={setQ} dept={dept} setDept={setDept} deptNames={deptNames} />
      <DataTable
        rows={shown}
        rowKey={(e) => e.id}
        empty="No users match."
        columns={[
          {
            key: "n",
            header: "User",
            cell: (e) => (
              <span className="flex items-center gap-3">
                <Avatar name={e.name} size="sm" />
                <span className="min-w-0">
                  <span className="block font-medium whitespace-nowrap text-navy-900">{e.name}</span>
                  <span className="text-xs text-ink-faint">{e.email}</span>
                </span>
              </span>
            ),
          },
          { key: "d", header: "Department", cell: (e) => <span className="whitespace-nowrap">{e.department}</span> },
          {
            key: "r",
            header: "Role",
            cell: (e) =>
              e.id === myId ? (
                <span className="text-sm text-ink-faint">Admin / HR (you)</span>
              ) : (
                <select
                  defaultValue={e.role}
                  disabled={pending || e.status === "Inactive"}
                  onChange={(ev) => {
                    const role = ev.target.value as Role;
                    start(async () => {
                      const r = await setRole(e.id, role);
                      if (r) show(r.message);
                    });
                  }}
                  className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm disabled:bg-canvas"
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
      {toast}
    </Card>
  );
}
