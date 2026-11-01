"use client";

import { useState } from "react";
import { Modal, useToast } from "@/components/client-ui";
import { buttonClass, Card, DataTable, Field, inputClass, PageHeader, StatusBadge } from "@/components/ui";
import { formatDate, helpdesk, type HelpdeskRequest } from "@/lib/sample-data";

const seed: (HelpdeskRequest & { from: string })[] = [
  { id: "HR-0461", subject: "Maternity leave policy", message: "How many weeks of maternity leave am I entitled to and how do I apply?", status: "Open", created: "2026-11-01", from: "Rabia Iqbal" },
  { id: "HR-0459", subject: "Change bank account for salary", message: "I have moved my salary account. New IBAN attached.", status: "Open", created: "2026-10-31", from: "Omar Farooq" },
  ...helpdesk.map((h) => ({ ...h, from: "Ayesha Khan" })),
];

export default function AdminHelpdesk() {
  const [list, setList] = useState(seed);
  const [sel, setSel] = useState<(typeof seed)[number] | null>(null);
  const { show, toast } = useToast();

  return (
    <>
      <PageHeader title="HR Helpdesk" subtitle="Questions and requests from employees. Reply and close them here." />
      <Card pad={false}>
        <DataTable
          rows={list}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Request", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "f", header: "From", cell: (r) => r.from },
            { key: "s", header: "Subject", cell: (r) => <span className="font-medium text-navy-900">{r.subject}</span> },
            { key: "d", header: "Received", cell: (r) => formatDate(r.created), className: "whitespace-nowrap" },
            { key: "st", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            { key: "a", header: "", cell: (r) => <button className={buttonClass(r.status === "Resolved" ? "ghost" : "primary", "sm")} onClick={() => setSel(r)}>{r.status === "Resolved" ? "View" : "Reply"}</button> },
          ]}
        />
      </Card>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.subject ?? ""}>
        {sel && (
          <form
            action={(f) => {
              const status = f.get("resolve") ? "Resolved" : "In progress";
              setList((l) => l.map((x) => (x.id === sel.id ? { ...x, reply: String(f.get("reply")), status } : x)));
              setSel(null);
              show(`Reply sent to ${sel.from}`);
            }}
            className="space-y-4"
          >
            <p className="rounded-lg bg-navy-50 p-3 text-sm"><span className="font-medium">{sel.from}: </span>{sel.message}</p>
            <Field label="Reply"><textarea name="reply" required rows={4} defaultValue={sel.reply} className={inputClass} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="resolve" className="accent-accent-600" /> Mark as resolved</label>
            <div className="flex justify-end gap-2">
              <button type="button" className={buttonClass("outline")} onClick={() => setSel(null)}>Cancel</button>
              <button type="submit" className={buttonClass("primary")}>Send reply</button>
            </div>
          </form>
        )}
      </Modal>
      {toast}
    </>
  );
}
