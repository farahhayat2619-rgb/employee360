"use client";

import { Forward } from "lucide-react";
import { useState } from "react";
import { Modal, Tabs, useToast } from "@/components/client-ui";
import { nowStamp, TicketDetails } from "@/components/ticket-parts";
import { buttonClass, Card, DataTable, Field, inputClass, PageHeader, StatusBadge } from "@/components/ui";
import { departments, formatDate, tickets as seed, type Ticket, type TicketStatus } from "@/lib/sample-data";

const ME = "Imran Siddiqui";

export default function TicketReview() {
  const [list, setList] = useState<Ticket[]>(seed);
  const [sel, setSel] = useState<Ticket | null>(null);
  const { show, toast } = useToast();

  function forward(f: FormData) {
    if (!sel) return;
    const dept = String(f.get("dept"));
    const note = String(f.get("note") || "");
    const t: Ticket = {
      ...sel,
      status: "Pending",
      forwardedTo: dept,
      latestUpdate: `Forwarded to ${dept}`,
      history: [...sel.history, { at: nowStamp(), by: ME, action: "Forwarded", note: `Forwarded to ${dept}${note ? `: ${note}` : ""}` }],
    };
    setList((l) => l.map((x) => (x.id === t.id ? t : x)));
    setSel(null);
    show(`${t.id} forwarded to ${dept}`);
  }

  const table = (s: TicketStatus) => (
    <Card pad={false}>
      <DataTable
        rows={list.filter((t) => t.status === s)}
        rowKey={(t) => t.id}
        empty={`No ${s.toLowerCase()} tickets.`}
        columns={[
          { key: "id", header: "Ticket ID", cell: (t) => <span className="font-mono text-xs">{t.id}</span> },
          { key: "s", header: "Subject", cell: (t) => <span className="font-medium text-navy-900">{t.subject}</span> },
          { key: "by", header: "Submitted by", cell: (t) => <span>{t.submittedBy}<span className="block text-xs text-ink-faint">{t.employeeId} · {t.department}</span></span> },
          { key: "d", header: "Date", cell: (t) => formatDate(t.submitted), className: "whitespace-nowrap" },
          { key: "f", header: "Forwarded to", cell: (t) => t.forwardedTo ?? <span className="text-ink-faint">—</span> },
          { key: "u", header: "Latest update", cell: (t) => <span className="text-ink-soft">{t.latestUpdate}</span> },
          { key: "st", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          {
            key: "a",
            header: "",
            cell: (t) => (
              <button className={buttonClass(t.status === "Open" ? "primary" : "ghost", "sm")} onClick={() => setSel(t)}>
                {t.status === "Open" ? <><Forward className="size-3.5" /> Review</> : "Track"}
              </button>
            ),
          },
        ]}
      />
    </Card>
  );
  const n = (s: TicketStatus) => list.filter((t) => t.status === s).length;

  return (
    <>
      <PageHeader title="Ticket Review" subtitle="Every complaint comes here first. Review it and forward it to the department that can resolve it." />
      <Tabs
        tabs={[
          { id: "o", label: `Open (${n("Open")})`, content: table("Open") },
          { id: "p", label: `Pending (${n("Pending")})`, content: table("Pending") },
          { id: "c", label: `Closed (${n("Closed")})`, content: table("Closed") },
        ]}
      />
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.status === "Open" ? "Review and forward" : "Track ticket"} wide>
        {sel && (
          <div className="space-y-6">
            <TicketDetails t={sel} />
            {sel.status === "Open" && (
              <form action={forward} className="space-y-4 border-t border-line pt-5">
                <Field label="Forward to department">
                  <select name="dept" required className={inputClass} defaultValue="">
                    <option value="" disabled>Choose the concerned department</option>
                    {departments.map((d) => (
                      <option key={d.id}>{d.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Note for the department (optional)">
                  <textarea name="note" rows={2} className={inputClass} />
                </Field>
                <div className="flex justify-end gap-2">
                  <button type="button" className={buttonClass("outline")} onClick={() => setSel(null)}>Cancel</button>
                  <button type="submit" className={buttonClass("primary")}><Forward className="size-4" /> Forward ticket</button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
      {toast}
    </>
  );
}
