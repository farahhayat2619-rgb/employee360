"use client";

import { useState } from "react";
import { Modal, useToast } from "@/components/client-ui";
import { nowStamp, TicketDetails } from "@/components/ticket-parts";
import { buttonClass, Card, DataTable, Field, inputClass, PageHeader, StatusBadge } from "@/components/ui";
import { formatDate, tickets as seed, type Ticket } from "@/lib/sample-data";

// Design preview shows the Information Technology inbox (as seen by Zain Abbas, Systems Engineer).
const DEPT = "Information Technology";
const ME = "Zain Abbas";

export default function DepartmentInbox() {
  const [list, setList] = useState<Ticket[]>(() => seed.filter((t) => t.forwardedTo === DEPT));
  const [sel, setSel] = useState<Ticket | null>(null);
  const [mode, setMode] = useState<"update" | "close">("update");
  const { show, toast } = useToast();

  function act(f: FormData) {
    if (!sel) return;
    const note = String(f.get("note"));
    const updated: Ticket =
      mode === "close"
        ? { ...sel, status: "Closed", latestUpdate: "Resolved", resolution: note, history: [...sel.history, { at: nowStamp(), by: ME, action: "Closed", note: "Resolved: " + note }] }
        : { ...sel, latestUpdate: note, history: [...sel.history, { at: nowStamp(), by: ME, action: "Updated", note }] };
    setList((l) => l.map((t) => (t.id === sel.id ? updated : t)));
    setSel(null);
    show(mode === "close" ? `${sel.id} closed. The submitter has been notified.` : `${sel.id} updated`);
  }

  return (
    <>
      <PageHeader title="Department Inbox" subtitle={`Complaints forwarded by management to ${DEPT}. Update them as you work and close them when resolved.`} />
      <Card pad={false}>
        <DataTable
          rows={list}
          rowKey={(t) => t.id}
          columns={[
            { key: "id", header: "Ticket ID", cell: (t) => <span className="font-mono text-xs">{t.id}</span> },
            { key: "s", header: "Subject", cell: (t) => <span className="font-medium text-navy-900">{t.subject}</span> },
            { key: "by", header: "From", cell: (t) => `${t.submittedBy}, ${t.department}` },
            { key: "d", header: "Submitted", cell: (t) => formatDate(t.submitted), className: "whitespace-nowrap" },
            { key: "u", header: "Latest update", cell: (t) => <span className="text-ink-soft">{t.latestUpdate}</span> },
            { key: "st", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
            {
              key: "a",
              header: "",
              cell: (t) =>
                t.status !== "Closed" ? (
                  <div className="flex gap-1">
                    <button className={buttonClass("outline", "sm")} onClick={() => { setSel(t); setMode("update"); }}>Update</button>
                    <button className={buttonClass("primary", "sm")} onClick={() => { setSel(t); setMode("close"); }}>Close</button>
                  </div>
                ) : (
                  <button className={buttonClass("ghost", "sm")} onClick={() => { setSel(t); setMode("update"); }}>View</button>
                ),
            },
          ]}
        />
      </Card>

      <Modal open={!!sel} onClose={() => setSel(null)} title={mode === "close" ? "Close ticket" : "Update ticket"} wide>
        {sel && (
          <div className="space-y-6">
            <TicketDetails t={sel} />
            {sel.status !== "Closed" && (
              <form action={act} className="space-y-4 border-t border-line pt-5">
                <Field label={mode === "close" ? "Resolution details" : "Progress update"}>
                  <textarea name="note" required minLength={5} rows={3} className={inputClass} />
                </Field>
                <div className="flex justify-end gap-2">
                  <button type="button" className={buttonClass("outline")} onClick={() => setSel(null)}>Cancel</button>
                  <button type="submit" className={buttonClass("primary")}>{mode === "close" ? "Mark as closed" : "Save update"}</button>
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
