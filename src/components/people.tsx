"use client";

import clsx from "clsx";
import { Pencil, Search, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setEmployeeActive } from "@/app/actions/people";
import { departments as sampleDepartments, formatDate } from "@/lib/sample-data";
import type { DirectoryEmployee } from "@/lib/types";
import { useToast } from "./client-ui";
import { Avatar, Badge, buttonClass, Card, DataTable, StatusBadge } from "./ui";

export function Filters({
  q,
  setQ,
  dept,
  setDept,
  lockDept,
  extra,
  deptNames = sampleDepartments.map((d) => d.name),
}: {
  q: string;
  setQ: (v: string) => void;
  dept: string;
  setDept?: (v: string) => void;
  lockDept?: boolean;
  extra?: React.ReactNode;
  deptNames?: string[];
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID" className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm" aria-label="Search" />
      </div>
      {setDept && (
        <select value={dept} disabled={lockDept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm disabled:bg-canvas" aria-label="Department">
          <option value="All">All departments</option>
          {deptNames.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      )}
      {extra}
    </div>
  );
}

const roleLabel = { employee: "Employee", management: "Management", admin: "Admin / HR" } as const;

export function EmployeeDirectory({ rows: all, deptNames, defaultDept, admin }: { rows: DirectoryEmployee[]; deptNames: string[]; defaultDept?: string; admin?: boolean }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState(defaultDept ?? "All");
  const [status, setStatus] = useState("All");
  const [pending, start] = useTransition();
  const { show, toast } = useToast();

  const rows = useMemo(
    () =>
      all.filter(
        (e) =>
          (dept === "All" || e.department === dept) &&
          (status === "All" || e.status === status) &&
          (e.name.toLowerCase().includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase()) || e.email.includes(q.toLowerCase())),
      ),
    [all, q, dept, status],
  );

  const toggle = (e: DirectoryEmployee) =>
    start(async () => {
      const r = await setEmployeeActive(e.id, e.status === "Inactive");
      if (r) show(r.message);
    });

  return (
    <Card pad={false}>
      <Filters
        q={q}
        setQ={setQ}
        dept={dept}
        setDept={setDept}
        deptNames={deptNames}
        extra={
          <>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm" aria-label="Status">
              <option value="All">All statuses</option>
              <option>Active</option>
              <option>On leave</option>
              <option>Inactive</option>
            </select>
            <span className="text-xs text-ink-faint sm:ml-auto">
              {rows.length} of {all.length} employees
            </span>
          </>
        }
      />
      <DataTable
        rows={rows}
        rowKey={(e) => e.id}
        empty="No employees match these filters."
        columns={[
          {
            key: "n",
            header: "Employee",
            cell: (e) => (
              <span className="flex items-center gap-3">
                <Avatar name={e.name} size="sm" />
                <span className="min-w-0">
                  <span className="block font-medium whitespace-nowrap text-navy-900">{e.name}</span>
                  <span className="text-xs text-ink-faint">{e.id}</span>
                </span>
              </span>
            ),
          },
          {
            key: "d",
            header: "Department",
            cell: (e) => (
              <span className="whitespace-nowrap">
                <span className="block">{e.department}</span>
                <span className="text-xs text-ink-faint">{e.office}</span>
              </span>
            ),
          },
          { key: "r", header: "Designation", cell: (e) => <span className="text-ink-soft">{e.designation}</span> },
          { key: "j", header: "Joined", cell: (e) => formatDate(e.joiningDate), className: "whitespace-nowrap" },
          ...(admin ? [{ key: "role", header: "Role", cell: (e: DirectoryEmployee) => <Badge tone={e.role === "employee" ? "grey" : "navy"}>{roleLabel[e.role]}</Badge> }] : []),
          { key: "s", header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
          ...(admin
            ? [
                {
                  key: "a",
                  header: "",
                  cell: (e: DirectoryEmployee) => (
                    <span className="flex gap-1">
                      <Link href={`/admin/employees/new?edit=${e.id}`} className={buttonClass("ghost", "sm")} aria-label={`Edit ${e.name}`} title="Edit">
                        <Pencil className="size-3.5" />
                      </Link>
                      <button
                        disabled={pending}
                        className={clsx(buttonClass("ghost", "sm"), e.status === "Inactive" ? "text-good" : "text-bad")}
                        aria-label={`${e.status === "Inactive" ? "Reactivate" : "Deactivate"} ${e.name}`}
                        title={e.status === "Inactive" ? "Reactivate" : "Deactivate"}
                        onClick={() => toggle(e)}
                      >
                        {e.status === "Inactive" ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
                      </button>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
      {toast}
    </Card>
  );
}
