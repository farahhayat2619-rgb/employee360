"use client";

import { Headset, Plus } from "lucide-react";
import { useState } from "react";
import { Modal, useToast } from "@/components/client-ui";
import { buttonClass, Card, Field, inputClass, PageHeader, StatusBadge } from "@/components/ui";
import { formatDate, helpdesk, type HelpdeskRequest } from "@/lib/sample-data";

export default function HelpdeskPage() {
  const [list, setList] = useState<HelpdeskRequest[]>(helpdesk);
  const [open, setOpen] = useState(false);
  const { show, toast } = useToast();

  return (
    <>
      <PageHeader
        title="HR Helpdesk"
        subtitle="Ask HR a question or request a document. Replies usually come within 2 working days."
        actions={
          <button className={buttonClass("primary")} onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New request
          </button>
        }
      />
      <div className="space-y-4">
        {list.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink-faint">{r.id}</span>
                <StatusBadge status={r.status} />
              </div>
              <span className="text-xs text-ink-faint">{formatDate(r.created)}</span>
            </div>
            <h3 className="mt-2 font-semibold text-navy-900">{r.subject}</h3>
            <p className="mt-1 text-sm text-ink-soft">{r.message}</p>
            {r.reply && (
              <div className="mt-3 flex gap-2 rounded-lg bg-navy-50 p-3 text-sm">
                <Headset className="mt-0.5 size-4 shrink-0 text-accent-600" />
                <p>
                  <span className="font-medium text-navy-900">HR: </span>
                  {r.reply}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New HR request">
        <form
          action={(f) => {
            const r: HelpdeskRequest = { id: `HR-0${458 + list.length - 3}`, subject: String(f.get("subject")), message: String(f.get("message")), status: "Open", created: new Date().toISOString().slice(0, 10) };
            setList((l) => [r, ...l]);
            setOpen(false);
            show(`Request ${r.id} sent to HR`);
          }}
          className="space-y-4"
        >
          <Field label="Subject">
            <input name="subject" required minLength={4} className={inputClass} placeholder="e.g. Experience letter" />
          </Field>
          <Field label="How can HR help?">
            <textarea name="message" required minLength={10} rows={5} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Send to HR</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
