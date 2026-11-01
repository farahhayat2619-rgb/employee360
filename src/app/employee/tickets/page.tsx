"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Modal, Tabs, useToast } from "@/components/client-ui";
import { nowStamp, TicketDetails } from "@/components/ticket-parts";
import { buttonClass, Card, DataTable, Field, inputClass, PageHeader, StatusBadge } from "@/components/ui";
import { currentUsers, employeeById, formatDate, nextTicketId, tickets as seed, type Ticket, type TicketStatus } from "@/lib/sample-data";

export default function EmployeeTickets() {
  const me = employeeById(currentUsers.employee);
  const [list, setList] = useState<Ticket[]>(() => seed.filter((t) => t.employeeId === me.id));
  const [newOpen, setNewOpen] = useState(false);
  const [view, setView] = useState<Ticket | null>(null);
  const { show, toast } = useToast();

  function submit(form: FormData) {
    const t: Ticket = {
      id: nextTicketId([...seed, ...list]),
      subject: String(form.get("subject")),
      description: String(form.get("description")),
      submittedBy: me.name,
      employeeId: me.id,
      department: me.department,
      submitted: new Date().toISOString().slice(0, 10),
      forwardedTo: null,
      status: "Open",
      latestUpdate: "Waiting for management review",
      resolution: null,
      history: [{ at: nowStamp(), by: me.name, action: "Submitted", note: "Ticket created" }],
    };
    setList((l) => [t, ...l]);
    setNewOpen(false);
    show(`Ticket ${t.id} submitted to management`);
  }

  const table = (status: TicketStatus) => (
    <Card pad={false}>
      <DataTable
        rows={list.filter((t) => t.status === status)}
        rowKey={(t) => t.id}
        empty={`No ${status.toLowerCase()} tickets.`}
        columns={[
          { key: "id", header: "Ticket ID", cell: (t) => <button onClick={() => setView(t)} className="font-mono text-xs font-medium text-accent-700 hover:underline">{t.id}</button> },
          { key: "subject", header: "Subject", cell: (t) => <span className="font-medium text-navy-900">{t.subject}</span> },
          { key: "date", header: "Submitted", cell: (t) => formatDate(t.submitted), className: "whitespace-nowrap" },
          { key: "fwd", header: "Forwarded to", cell: (t) => t.forwardedTo ?? <span className="text-ink-faint">—</span> },
          { key: "update", header: "Latest update", cell: (t) => <span className="text-ink-soft">{t.latestUpdate}</span> },
          { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
        ]}
      />
    </Card>
  );

  const count = (s: TicketStatus) => list.filter((t) => t.status === s).length;

  return (
    <>
      <PageHeader
        title="Complaint Tickets"
        subtitle="Report an issue. Management reviews it and forwards it to the department that can fix it."
        actions={
          <button className={buttonClass("primary")} onClick={() => setNewOpen(true)}>
            <Plus className="size-4" /> New complaint
          </button>
        }
      />
      <Tabs
        tabs={[
          { id: "open", label: `Open (${count("Open")})`, content: table("Open") },
          { id: "pending", label: `Pending (${count("Pending")})`, content: table("Pending") },
          { id: "closed", label: `Closed (${count("Closed")})`, content: table("Closed") },
        ]}
      />

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Submit a complaint">
        <form action={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Submitted by">
              <input className={inputClass} value={`${me.name} (${me.id})`} readOnly />
            </Field>
            <Field label="Department">
              <input className={inputClass} value={me.department} readOnly />
            </Field>
          </div>
          <Field label="Complaint subject">
            <input name="subject" required minLength={5} maxLength={120} className={inputClass} placeholder="e.g. Printer on 2nd floor keeps jamming" />
          </Field>
          <Field label="Complaint description" hint="Say what is happening, where, and since when.">
            <textarea name="description" required minLength={10} rows={5} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setNewOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={buttonClass("primary")}>
              Submit ticket
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title="Ticket details" wide>
        {view && <TicketDetails t={view} />}
      </Modal>
      {toast}
    </>
  );
}
