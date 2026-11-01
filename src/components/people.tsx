"use client";

import clsx from "clsx";
import { Pencil, Search, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { departments, employees as seed, formatDate, type Employee } from "@/lib/sample-data";
import { useToast } from "./client-ui";
import { Avatar, buttonClass, Card, DataTable, Progress, StatusBadge } from "./ui";

export function Filters({ q, setQ, dept, setDept, lockDept, extra }: { q: string; setQ: (v: string) => void; dept: string; setDept?: (v: string) => void; lockDept?: boolean; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID" className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm" aria-label="Search" />
      </div>
      {setDept && (
        <select value={dept} disabled={lockDept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm disabled:bg-canvas" aria-label="Department">
          <option value="All">All departments</option>
          {departments.map((d) => (
            <option key={d.id}>{d.name}</option>
          ))}
        </select>
      )}
      {extra}
    </div>
  );
}

export function EmployeeDirectory({ scopeDept, admin }: { scopeDept?: string; admin?: boolean }) {
  const [list, setList] = useState<Employee[]>(seed);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState(scopeDept ?? "All");
  const [status, setStatus] = useState("All");
  const { show, toast } = useToast();

  const rows = useMemo(
    () =>
      list.filter(
        (e) =>
          (dept === "All" || e.department === dept) &&
          (status === "All" || e.status === status) &&
          (e.name.toLowerCase().includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [list, q, dept, status],
  );

  return (
    <Card pad={false}>
      <Filters
        q={q}
        setQ={setQ}
        dept={dept}
        setDept={setDept}
        extra={
          <>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm" aria-label="Status">
              <option>All</option>
              <option>Active</option>
              <option>On leave</option>
              <option>Inactive</option>
            </select>
            <span className="text-xs text-ink-faint sm:ml-auto">{rows.length} employees</span>
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
                <span>
                  <span className="block font-medium text-navy-900">{e.name}</span>
                  <span className="text-xs text-ink-faint">{e.id}</span>
                </span>
              </span>
            ),
          },
          { key: "d", header: "Department", cell: (e) => e.department },
          { key: "r", header: "Designation", cell: (e) => <span className="text-ink-soft">{e.designation}</span> },
          ...(admin
            ? [{ key: "j", header: "Joined", cell: (e: Employee) => formatDate(e.joiningDate), className: "whitespace-nowrap" }]
            : [{ key: "t", header: "Today", cell: (e: Employee) => <StatusBadge status={e.todayStatus} /> }]),
          {
            key: "p",
            header: "Performance",
            cell: (e) => (
              <span className="flex w-28 items-center gap-2">
                <Progress value={e.performance} tone={e.performance >= 85 ? "good" : e.performance >= 75 ? "blue" : "warn"} />
                <span className="text-xs tabular-nums">{e.performance}</span>
              </span>
            ),
          },
          { key: "s", header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
          ...(admin
            ? [
                {
                  key: "a",
                  header: "",
                  cell: (e: Employee) => (
                    <span className="flex gap-1">
                      <Link href={`/admin/employees/new?edit=${e.id}`} className={buttonClass("ghost", "sm")} aria-label={`Edit ${e.name}`}>
                        <Pencil className="size-3.5" />
                      </Link>
                      {e.status !== "Inactive" && (
                        <button
                          className={clsx(buttonClass("ghost", "sm"), "text-bad")}
                          aria-label={`Deactivate ${e.name}`}
                          onClick={() => {
                            setList((l) => l.map((x) => (x.id === e.id ? { ...x, status: "Inactive" } : x)));
                            show(`${e.name} deactivated. Their login is disabled.`);
                          }}
                        >
                          <UserX className="size-3.5" />
                        </button>
                      )}
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
