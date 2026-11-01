import clsx from "clsx";
import { CheckCircle2, Forward, PenLine, Send } from "lucide-react";
import { formatDate } from "@/lib/sample-data";
import type { AnnouncementTypeLabel, TicketView } from "@/lib/types";
import { KeyValue, StatusBadge, type Tone } from "./ui";

/** Badge colour for an announcement type (shared by server and client components). */
export const annTone = (t: AnnouncementTypeLabel): Tone => (t === "Important" ? "bad" : t === "Holiday" ? "good" : t === "HR" ? "navy" : "blue");

const icons = { Submitted: Send, Forwarded: Forward, Updated: PenLine, Closed: CheckCircle2 } as const;

export function TicketDetails({ t }: { t: TicketView }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-faint">{t.id}</span>
          <StatusBadge status={t.status} />
        </div>
        <h3 className="mt-1 text-lg font-semibold text-navy-900">{t.subject}</h3>
        <p className="mt-1 text-sm text-ink-soft">{t.description}</p>
      </div>
      <KeyValue
        items={[
          { label: "Submitted by", value: `${t.submittedBy} (${t.employeeId})` },
          { label: "Department", value: t.department },
          { label: "Submission date", value: formatDate(t.submitted) },
          { label: "Forwarded to", value: t.forwardedTo ?? "Not yet forwarded" },
          { label: "Latest update", value: t.latestUpdate },
          { label: "Resolution", value: t.resolution ?? "—" },
        ]}
      />
      <div>
        <h4 className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">History</h4>
        <ol className="relative space-y-4 border-l border-line pl-6">
          {t.history.map((h, i) => {
            const Icon = icons[h.action as keyof typeof icons] ?? PenLine;
            return (
              <li key={i} className="relative">
                <span className={clsx("absolute top-0 -left-[35px] grid size-6 place-items-center rounded-full", h.action === "Closed" ? "bg-good text-white" : "bg-accent-100 text-accent-700")}>
                  <Icon className="size-3.5" />
                </span>
                <p className="text-sm font-medium text-navy-900">
                  {h.action} <span className="font-normal text-ink-soft">by {h.by}</span>
                </p>
                <p className="text-sm text-ink-soft">{h.note}</p>
                <p className="text-xs text-ink-faint">{h.at}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
