"use client";

import clsx from "clsx";
import { Download, FileText, Search } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/client-ui";
import { buttonClass, Card, PageHeader } from "@/components/ui";
import { formatDate, policies } from "@/lib/sample-data";

const categories = ["All", "HR Policies", "Attendance Policies", "Leave Policies", "Code of Conduct", "Employee Handbook", "Policy Documents"];

export default function PoliciesPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const { show, toast } = useToast();
  const list = policies.filter((p) => (cat === "All" || p.category === cat) && p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Company Policies" subtitle="The latest approved version of every policy. HR updates these documents." />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search policies" className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={clsx("rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap", c === cat ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-surface text-ink-soft hover:border-navy-100")}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bad-50 text-bad">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-navy-900">{p.title}</p>
                <p className="text-xs text-ink-faint">{p.category}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              {p.version} · {p.pages} pages · Updated {formatDate(p.updated)}
            </p>
            <div className="mt-4 flex gap-2">
              <button className={buttonClass("outline", "sm")} onClick={() => show("Policy documents are uploaded by HR in Phase 4")}>Open</button>
              <button className={buttonClass("ghost", "sm")} onClick={() => show("Policy documents are uploaded by HR in Phase 4")}>
                <Download className="size-3.5" /> Download
              </button>
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="col-span-full py-10 text-center text-sm text-ink-faint">No policies match your search.</p>}
      </div>
      {toast}
    </>
  );
}
