"use client";

import clsx from "clsx";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Forward,
  Headset,
  Megaphone,
  PartyPopper,
  Plus,
  Star,
  Target,
  Ticket,
  Trash2,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { forwardTicket, markAllNotificationsRead, markNotificationRead, postAnnouncement, removeAnnouncement, replyHelpdesk, submitHelpdesk, submitTicket, workTicket } from "@/app/actions/comms";
import { formatDate } from "@/lib/sample-data";
import type { ActionResult, AnnouncementTypeLabel, AnnouncementView, HelpdeskView, NotificationView, TicketStatusLabel, TicketView } from "@/lib/types";
import { keepOnSubmit, Modal, Tabs, useToast } from "./client-ui";
import { annTone, TicketDetails } from "./ticket-parts";
import { Badge, buttonClass, Card, DataTable, Field, inputClass, PageHeader, StatusBadge } from "./ui";

function Err({ state }: { state: ActionResult }) {
  return state && !state.ok ? (
    <p className="rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad" role="alert">
      {state.message}
    </p>
  ) : null;
}

/** A modal form wired to a server action: keeps typed text on errors and reports success upwards. */
function useModalAction(run: (prev: ActionResult, f: FormData) => Promise<ActionResult>, onDone: (m: string) => void) {
  return useActionState<ActionResult, FormData>(async (p, f) => {
    const r = await run(p, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
}

const STATUSES: TicketStatusLabel[] = ["Open", "Pending", "Closed"];
const none = <span className="text-ink-faint">—</span>;

/* ================= Complaint tickets: employee ================= */

export function MyTickets({ me, tickets }: { me: { id: string; name: string; department: string }; tickets: TicketView[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const [round, setRound] = useState(0);
  const [view, setView] = useState<TicketView | null>(null);
  const { show, toast } = useToast();
  const count = (s: TicketStatusLabel) => tickets.filter((t) => t.status === s).length;

  const table = (status: TicketStatusLabel) => (
    <Card pad={false}>
      <DataTable
        rows={tickets.filter((t) => t.status === status)}
        rowKey={(t) => t.id}
        empty={`No ${status.toLowerCase()} tickets.`}
        columns={[
          {
            key: "id",
            header: "Ticket ID",
            cell: (t) => (
              <button onClick={() => setView(t)} className="font-mono text-xs font-medium whitespace-nowrap text-accent-700 hover:underline">
                {t.id}
              </button>
            ),
          },
          { key: "subject", header: "Subject", cell: (t) => <span className="font-medium text-navy-900">{t.subject}</span> },
          { key: "date", header: "Submitted", cell: (t) => formatDate(t.submitted), className: "whitespace-nowrap" },
          { key: "fwd", header: "Forwarded to", cell: (t) => t.forwardedTo ?? none },
          { key: "update", header: "Latest update", cell: (t) => <span className="text-ink-soft">{t.latestUpdate}</span> },
          { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
        ]}
      />
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Complaint Tickets"
        subtitle="Report an issue. Management reviews it and forwards it to the department that can fix it."
        actions={
          <button
            className={buttonClass("primary")}
            onClick={() => {
              setRound((r) => r + 1);
              setNewOpen(true);
            }}
          >
            <Plus className="size-4" /> New complaint
          </button>
        }
      />
      <Tabs tabs={STATUSES.map((s) => ({ id: s, label: `${s} (${count(s)})`, content: table(s) }))} />

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Submit a complaint">
        <TicketForm
          key={round}
          me={me}
          onClose={() => setNewOpen(false)}
          onDone={(m) => {
            setNewOpen(false);
            show(m);
          }}
        />
      </Modal>
      <Modal open={!!view} onClose={() => setView(null)} title="Ticket details" wide>
        {view && <TicketDetails t={view} />}
      </Modal>
      {toast}
    </>
  );
}

function TicketForm({ me, onClose, onDone }: { me: { id: string; name: string; department: string }; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useModalAction(submitTicket, onDone);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Submitted by">
          <input className={`${inputClass} bg-canvas`} value={`${me.name} (${me.id})`} readOnly />
        </Field>
        <Field label="Department">
          <input className={`${inputClass} bg-canvas`} value={me.department} readOnly />
        </Field>
      </div>
      <Field label="Complaint subject">
        <input name="subject" required minLength={5} maxLength={120} className={inputClass} placeholder="e.g. Printer on 2nd floor keeps jamming" />
      </Field>
      <Field label="Complaint description" hint="Say what is happening, where, and since when.">
        <textarea name="description" required minLength={10} maxLength={2000} rows={5} className={inputClass} />
      </Field>
      <p className="text-xs text-ink-faint">A ticket ID is created automatically. You’ll get a notification at every step.</p>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Submitting…" : "Submit ticket"}
        </button>
      </div>
    </form>
  );
}

/* ================= Complaint tickets: management review ================= */

export function TicketReview({ meId, tickets, departments }: { meId: string; tickets: TicketView[]; departments: string[] }) {
  const [sel, setSel] = useState<TicketView | null>(null);
  const [q, setQ] = useState("");
  const { show, toast } = useToast();
  const filtered = tickets.filter((t) => !q || `${t.id} ${t.subject} ${t.submittedBy} ${t.department}`.toLowerCase().includes(q.toLowerCase()));
  const n = (s: TicketStatusLabel) => filtered.filter((t) => t.status === s).length;

  const table = (s: TicketStatusLabel) => (
    <Card pad={false}>
      <div className="border-b border-line p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, subject, person or department" className={`${inputClass} sm:max-w-sm`} aria-label="Search tickets" />
      </div>
      <DataTable
        rows={filtered.filter((t) => t.status === s)}
        rowKey={(t) => t.id}
        empty={q ? "No tickets match your search." : `No ${s.toLowerCase()} tickets.`}
        columns={[
          { key: "id", header: "Ticket ID", cell: (t) => <span className="font-mono text-xs whitespace-nowrap">{t.id}</span> },
          { key: "s", header: "Subject", cell: (t) => <span className="font-medium text-navy-900">{t.subject}</span> },
          {
            key: "by",
            header: "Submitted by",
            cell: (t) => (
              <span className="whitespace-nowrap">
                {t.submittedBy}
                <span className="block text-xs text-ink-faint">
                  {t.employeeId} · {t.department}
                </span>
              </span>
            ),
          },
          { key: "d", header: "Date", cell: (t) => formatDate(t.submitted), className: "whitespace-nowrap" },
          { key: "f", header: "Forwarded to", cell: (t) => t.forwardedTo ?? none },
          { key: "u", header: "Latest update", cell: (t) => <span className="text-ink-soft">{t.latestUpdate}</span> },
          { key: "st", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          {
            key: "a",
            header: "",
            cell: (t) => {
              const canForward = t.status === "Open" && t.employeeId !== meId;
              return (
                <button className={buttonClass(canForward ? "primary" : "ghost", "sm")} onClick={() => setSel(t)} aria-label={`${canForward ? "Review" : "Track"} ${t.id}`}>
                  {canForward ? (
                    <>
                      <Forward className="size-3.5" /> Review
                    </>
                  ) : (
                    "Track"
                  )}
                </button>
              );
            },
          },
        ]}
      />
    </Card>
  );

  const canForward = sel?.status === "Open" && sel.employeeId !== meId;
  return (
    <>
      <PageHeader title="Ticket Review" subtitle="Every complaint comes here first. Review it and forward it to the department that can resolve it." />
      <Tabs tabs={STATUSES.map((s) => ({ id: s, label: `${s} (${n(s)})`, content: table(s) }))} />
      <Modal open={!!sel} onClose={() => setSel(null)} title={canForward ? "Review and forward" : "Track ticket"} wide>
        {sel && (
          <div className="space-y-6">
            <TicketDetails t={sel} />
            {canForward && (
              <ForwardForm
                key={sel.id}
                id={sel.id}
                departments={departments}
                onClose={() => setSel(null)}
                onDone={(m) => {
                  setSel(null);
                  show(m);
                }}
              />
            )}
            {sel.status === "Open" && sel.employeeId === meId && <p className="rounded-lg bg-navy-50 p-3 text-sm text-ink-soft">This is your own complaint, so another manager will review and forward it.</p>}
          </div>
        )}
      </Modal>
      {toast}
    </>
  );
}

function ForwardForm({ id, departments, onClose, onDone }: { id: string; departments: string[]; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useModalAction(forwardTicket, onDone);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4 border-t border-line pt-5">
      <input type="hidden" name="id" value={id} />
      <Field label="Forward to department">
        <select name="department" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Choose the concerned department
          </option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </Field>
      <Field label="Note for the department (optional)">
        <textarea name="note" rows={2} maxLength={500} className={inputClass} />
      </Field>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          <Forward className="size-4" /> {pending ? "Forwarding…" : "Forward ticket"}
        </button>
      </div>
    </form>
  );
}

/* ================= Complaint tickets: department inbox ================= */

export function DepartmentInbox({ meId, department, tickets }: { meId: string; department: string; tickets: TicketView[] }) {
  const [sel, setSel] = useState<{ t: TicketView; mode: "update" | "close" | "view" } | null>(null);
  const { show, toast } = useToast();
  const pending = tickets.filter((t) => t.status === "Pending");
  const closed = tickets.filter((t) => t.status === "Closed");

  const table = (rows: TicketView[], empty: string) => (
    <Card pad={false}>
      <DataTable
        rows={rows}
        rowKey={(t) => t.id}
        empty={empty}
        columns={[
          { key: "id", header: "Ticket ID", cell: (t) => <span className="font-mono text-xs whitespace-nowrap">{t.id}</span> },
          { key: "s", header: "Subject", cell: (t) => <span className="font-medium text-navy-900">{t.subject}</span> },
          { key: "by", header: "From", cell: (t) => <span className="whitespace-nowrap">{t.submittedBy}<span className="block text-xs text-ink-faint">{t.department}</span></span> },
          { key: "d", header: "Submitted", cell: (t) => formatDate(t.submitted), className: "whitespace-nowrap" },
          { key: "u", header: "Latest update", cell: (t) => <span className="text-ink-soft">{t.latestUpdate}</span> },
          { key: "st", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          {
            key: "a",
            header: "",
            cell: (t) =>
              t.status === "Pending" && t.employeeId !== meId ? (
                <div className="flex gap-1">
                  <button className={buttonClass("outline", "sm")} onClick={() => setSel({ t, mode: "update" })} aria-label={`Update ${t.id}`}>
                    Update
                  </button>
                  <button className={buttonClass("primary", "sm")} onClick={() => setSel({ t, mode: "close" })} aria-label={`Close ${t.id}`}>
                    Close
                  </button>
                </div>
              ) : (
                <button className={buttonClass("ghost", "sm")} onClick={() => setSel({ t, mode: "view" })} aria-label={`View ${t.id}`}>
                  View
                </button>
              ),
          },
        ]}
      />
    </Card>
  );

  return (
    <>
      <PageHeader title="Department Inbox" subtitle={`Complaints management forwarded to ${department}. Post updates as you work and close them when resolved.`} />
      <Tabs
        tabs={[
          { id: "p", label: `To do (${pending.length})`, content: table(pending, `Nothing waiting for ${department}.`) },
          { id: "c", label: `Closed (${closed.length})`, content: table(closed, "No closed tickets yet.") },
        ]}
      />
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.mode === "close" ? "Close ticket" : sel?.mode === "update" ? "Update ticket" : "Ticket details"} wide>
        {sel && (
          <div className="space-y-6">
            <TicketDetails t={sel.t} />
            {sel.mode !== "view" && (
              <WorkForm
                key={`${sel.t.id}-${sel.mode}`}
                id={sel.t.id}
                mode={sel.mode}
                onClose={() => setSel(null)}
                onDone={(m) => {
                  setSel(null);
                  show(m);
                }}
              />
            )}
            {sel.mode === "view" && sel.t.status === "Pending" && sel.t.employeeId === meId && <p className="rounded-lg bg-navy-50 p-3 text-sm text-ink-soft">You raised this complaint, so a colleague in {department} will handle it.</p>}
          </div>
        )}
      </Modal>
      {toast}
    </>
  );
}

function WorkForm({ id, mode, onClose, onDone }: { id: string; mode: "update" | "close"; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useModalAction(workTicket, onDone);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4 border-t border-line pt-5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="mode" value={mode} />
      <Field label={mode === "close" ? "Resolution details" : "Progress update"} hint="The person who raised the ticket will see this.">
        <textarea name="note" required minLength={5} maxLength={1000} rows={3} className={inputClass} />
      </Field>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : mode === "close" ? "Mark as closed" : "Save update"}
        </button>
      </div>
    </form>
  );
}

/* ================= HR helpdesk ================= */

export function MyHelpdesk({ requests }: { requests: HelpdeskView[] }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  const { show, toast } = useToast();
  return (
    <>
      <PageHeader
        title="HR Helpdesk"
        subtitle="Ask HR a question or request a document. Replies usually come within 2 working days."
        actions={
          <button
            className={buttonClass("primary")}
            onClick={() => {
              setRound((r) => r + 1);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New request
          </button>
        }
      />
      <div className="space-y-4">
        {requests.length === 0 && (
          <Card>
            <p className="py-6 text-center text-sm text-ink-faint">You haven’t asked HR anything yet. Use “New request” to start.</p>
          </Card>
        )}
        {requests.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink-faint">{r.id}</span>
                <StatusBadge status={r.status} />
              </div>
              <span className="text-xs text-ink-faint">{formatDate(r.created)}</span>
            </div>
            <h3 className="mt-2 font-semibold text-navy-900">{r.subject}</h3>
            <p className="mt-1 text-sm whitespace-pre-line text-ink-soft">{r.message}</p>
            {r.reply ? (
              <div className="mt-3 flex gap-2 rounded-lg bg-navy-50 p-3 text-sm">
                <Headset className="mt-0.5 size-4 shrink-0 text-accent-600" />
                <p className="whitespace-pre-line">
                  <span className="font-medium text-navy-900">{r.repliedBy ?? "HR"}: </span>
                  {r.reply}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-faint">Waiting for a reply from HR.</p>
            )}
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New HR request">
        <HelpdeskForm
          key={round}
          onClose={() => setOpen(false)}
          onDone={(m) => {
            setOpen(false);
            show(m);
          }}
        />
      </Modal>
      {toast}
    </>
  );
}

function HelpdeskForm({ onClose, onDone }: { onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useModalAction(submitHelpdesk, onDone);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <Field label="Subject">
        <input name="subject" required minLength={4} maxLength={120} className={inputClass} placeholder="e.g. Experience letter" />
      </Field>
      <Field label="How can HR help?">
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} className={inputClass} />
      </Field>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Sending…" : "Send to HR"}
        </button>
      </div>
    </form>
  );
}

export function HelpdeskAdmin({ requests, meId }: { requests: HelpdeskView[]; meId: string }) {
  const [sel, setSel] = useState<HelpdeskView | null>(null);
  const { show, toast } = useToast();
  const waiting = requests.filter((r) => r.status !== "Resolved");
  const resolved = requests.filter((r) => r.status === "Resolved");

  const table = (rows: HelpdeskView[], empty: string) => (
    <Card pad={false}>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty={empty}
        columns={[
          { key: "id", header: "Request", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "f", header: "From", cell: (r) => <span className="whitespace-nowrap">{r.from}<span className="block text-xs text-ink-faint">{r.employeeId} · {r.department}</span></span> },
          { key: "s", header: "Subject", cell: (r) => <span className="font-medium text-navy-900">{r.subject}</span> },
          { key: "d", header: "Received", cell: (r) => formatDate(r.created), className: "whitespace-nowrap" },
          { key: "st", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
          {
            key: "a",
            header: "",
            cell: (r) => (
              <button className={buttonClass(r.status === "Resolved" || r.employeeId === meId ? "ghost" : "primary", "sm")} onClick={() => setSel(r)} aria-label={`${r.status === "Resolved" ? "View" : "Reply to"} ${r.id}`}>
                {r.status === "Resolved" || r.employeeId === meId ? "View" : "Reply"}
              </button>
            ),
          },
        ]}
      />
    </Card>
  );

  return (
    <>
      <PageHeader title="HR Helpdesk" subtitle="Questions and requests from employees. Reply here; mark a request resolved when nothing more is needed." />
      <Tabs
        tabs={[
          { id: "w", label: `Waiting (${waiting.length})`, content: table(waiting, "No requests waiting. Nice work.") },
          { id: "r", label: `Resolved (${resolved.length})`, content: table(resolved, "Nothing resolved yet.") },
        ]}
      />
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.id} · ${sel.subject}` : ""}>
        {sel && (
          <div className="space-y-4">
            <p className="rounded-lg bg-navy-50 p-3 text-sm whitespace-pre-line">
              <span className="font-medium">{sel.from}: </span>
              {sel.message}
            </p>
            {sel.employeeId === meId ? (
              <p className="text-sm text-ink-soft">This is your own request, so another HR colleague needs to answer it.</p>
            ) : (
              <ReplyForm
                key={sel.id}
                req={sel}
                onClose={() => setSel(null)}
                onDone={(m) => {
                  setSel(null);
                  show(m);
                }}
              />
            )}
          </div>
        )}
      </Modal>
      {toast}
    </>
  );
}

function ReplyForm({ req, onClose, onDone }: { req: HelpdeskView; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useModalAction(replyHelpdesk, onDone);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <input type="hidden" name="id" value={req.id} />
      <Field label="Reply" hint={req.repliedBy ? `Last reply by ${req.repliedBy}. Sending again replaces it.` : undefined}>
        <textarea name="reply" required minLength={5} maxLength={2000} rows={4} defaultValue={req.reply ?? ""} className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="resolve" defaultChecked={req.status === "Resolved"} className="accent-accent-600" /> Mark as resolved
      </label>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  );
}

/* ================= Announcements ================= */

const ANN_TYPES: AnnouncementTypeLabel[] = ["HR", "Company news", "Holiday", "Reminder", "Important"];

export function AnnouncementsManager({ announcements, audiences, title, subtitle }: { announcements: AnnouncementView[]; audiences: string[]; title: string; subtitle: string }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  const [pending, start] = useTransition();
  const { show, toast } = useToast();

  const remove = (a: AnnouncementView) => {
    if (!window.confirm(`Remove “${a.title}”? Employees will no longer see it.`)) return;
    start(async () => {
      const r = await removeAnnouncement(a.id);
      if (r) show(r.message);
    });
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <button
            className={buttonClass("primary")}
            onClick={() => {
              setRound((r) => r + 1);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New announcement
          </button>
        }
      />
      <Card pad={false}>
        <DataTable
          rows={announcements}
          rowKey={(a) => a.id}
          empty="Nothing announced yet."
          columns={[
            {
              key: "t",
              header: "Title",
              cell: (a) => (
                <span>
                  <span className="block font-medium text-navy-900">{a.title}</span>
                  <span className="line-clamp-1 text-xs text-ink-faint">{a.body}</span>
                </span>
              ),
            },
            { key: "ty", header: "Type", cell: (a) => <Badge tone={annTone(a.type)}>{a.type}</Badge> },
            { key: "au", header: "Audience", cell: (a) => <span className="whitespace-nowrap">{a.audience}</span> },
            { key: "by", header: "Posted by", cell: (a) => <span className="whitespace-nowrap">{a.author}</span> },
            { key: "d", header: "Date", cell: (a) => formatDate(a.date), className: "whitespace-nowrap" },
            {
              key: "x",
              header: "",
              cell: (a) =>
                a.canRemove ? (
                  <button disabled={pending} onClick={() => remove(a)} className={clsx(buttonClass("ghost", "sm"), "text-bad")} aria-label={`Remove ${a.title}`} title="Remove">
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null,
            },
          ]}
        />
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="New announcement">
        <AnnouncementForm
          key={round}
          audiences={audiences}
          onClose={() => setOpen(false)}
          onDone={(m) => {
            setOpen(false);
            show(m);
          }}
        />
      </Modal>
      {toast}
    </>
  );
}

function AnnouncementForm({ audiences, onClose, onDone }: { audiences: string[]; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useModalAction(postAnnouncement, onDone);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <Field label="Title">
        <input name="title" required minLength={4} maxLength={120} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select name="type" className={inputClass} defaultValue="HR">
            {ANN_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Audience">
          <select name="audience" className={inputClass}>
            {audiences.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Message" hint="Everyone in the audience also gets a notification.">
        <textarea name="body" required minLength={10} maxLength={3000} rows={5} className={inputClass} />
      </Field>
      <Err state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}

export function AnnouncementCards({ announcements }: { announcements: AnnouncementView[] }) {
  if (announcements.length === 0)
    return (
      <Card>
        <p className="py-6 text-center text-sm text-ink-faint">No announcements yet.</p>
      </Card>
    );
  return (
    <div className="space-y-4">
      {announcements.map((a) => (
        <Card key={a.id}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={annTone(a.type)}>{a.type}</Badge>
            <span className="text-xs text-ink-faint">
              {formatDate(a.date)} · {a.author}
              {a.audience !== "All staff" && ` · ${a.audience}`}
            </span>
          </div>
          <h3 className="mt-2 font-semibold text-navy-900">{a.title}</h3>
          <p className="mt-1 text-sm whitespace-pre-line text-ink-soft">{a.body}</p>
        </Card>
      ))}
    </div>
  );
}

/* ================= Notifications ================= */

const icons: Record<string, typeof Bell> = {
  leave: CalendarDays,
  attendance: CalendarCheck,
  announcement: Megaphone,
  holiday: PartyPopper,
  ticket: Ticket,
  task: ClipboardList,
  payroll: Wallet,
  goal: Target,
  review: Star,
  policy: FileText,
  helpdesk: Headset,
};

function when(at: string, today: string) {
  const [d, t] = at.split(" ");
  if (d === today) return `Today, ${t}`;
  return `${formatDate(d, { day: "numeric", month: "short" })}, ${t}`;
}

export function NotificationCenter({ notifications, announcements, today, initialTab }: { notifications: NotificationView[]; announcements: AnnouncementView[]; today: string; initialTab?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [readNow, setReadNow] = useState<Set<string>>(new Set());
  const { show, toast } = useToast();
  const isRead = (n: NotificationView) => n.read || readNow.has(n.id);
  const unread = notifications.filter((n) => !isRead(n)).length;

  const open = (n: NotificationView) => {
    setReadNow((s) => new Set(s).add(n.id));
    start(async () => {
      if (!n.read) await markNotificationRead(n.id);
      if (n.link) router.push(n.link);
    });
  };

  return (
    <>
      <PageHeader
        title="Notifications & Announcements"
        subtitle="Approvals, updates and news from HR, your manager and the company."
        actions={
          <button
            className={buttonClass("outline")}
            disabled={unread === 0 || pending}
            onClick={() =>
              start(async () => {
                setReadNow(new Set(notifications.map((n) => n.id)));
                const r = await markAllNotificationsRead();
                if (r) show(r.message);
              })
            }
          >
            <CheckCircle2 className="size-4" /> Mark all as read
          </button>
        }
      />
      <Tabs
        initial={initialTab === "announcements" ? "a" : "n"}
        tabs={[
          {
            id: "n",
            label: `My notifications${unread ? ` (${unread})` : ""}`,
            content: (
              <Card pad={false}>
                {notifications.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">You’re all caught up. New approvals and updates will appear here.</p>}
                <ul className="divide-y divide-line">
                  {notifications.map((n) => {
                    const Icon = icons[n.type] ?? Bell;
                    const fresh = !isRead(n);
                    return (
                      <li key={n.id}>
                        <button onClick={() => open(n)} className={clsx("flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-navy-50/50", fresh && "bg-accent-50/60")}>
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-800">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={clsx("block text-sm", fresh ? "font-semibold text-navy-900" : "text-ink")}>{n.message}</span>
                            <span className="text-xs text-ink-faint capitalize">
                              {n.type} · {when(n.at, today)}
                            </span>
                          </span>
                          {fresh && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent-600" aria-label="Unread" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ),
          },
          { id: "a", label: `Announcements (${announcements.length})`, content: <AnnouncementCards announcements={announcements} /> },
        ]}
      />
      {toast}
    </>
  );
}
