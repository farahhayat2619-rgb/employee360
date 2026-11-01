import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/sample-data";
import { monthLabel } from "@/lib/time";
import type { AttendanceDay } from "@/lib/types";
import { Badge, buttonClass, StatusBadge, type Column } from "./ui";

/** Says where a record came from, so demo or corrected days are never mistaken for GPS-verified ones. */
export function SourceBadge({ gpsVerified, corrected, hasPunch, note }: { gpsVerified: boolean; corrected: boolean; hasPunch: boolean; note?: string | null }) {
  if (corrected) return <span title={note ?? undefined}><Badge tone="blue">Corrected by HR</Badge></span>;
  if (gpsVerified) return <Badge tone="good">GPS verified</Badge>;
  if (hasPunch) return <Badge tone="grey">Demo data</Badge>;
  return null;
}

export const dayColumns: Column<AttendanceDay>[] = [
  { key: "date", header: "Date", cell: (a) => <span className="font-medium whitespace-nowrap text-navy-900">{formatDate(a.date, { weekday: "short", day: "numeric", month: "short" })}</span> },
  { key: "in", header: "Punch in", cell: (a) => a.in ?? "—", className: "tabular-nums" },
  { key: "out", header: "Punch out", cell: (a) => a.out ?? "—", className: "tabular-nums" },
  { key: "hours", header: "Hours", cell: (a) => (a.hours ? `${a.hours.toFixed(1)} h` : "—"), className: "tabular-nums" },
  {
    key: "loc",
    header: "Location",
    cell: (a) => (a.location ? <span className="whitespace-nowrap text-ink-soft">{a.location}{a.distance !== null && a.in ? ` · ${a.distance} m` : ""}</span> : "—"),
  },
  {
    key: "status",
    header: "Status",
    cell: (a) => (
      <span className="flex flex-wrap gap-1.5">
        <StatusBadge status={a.status} />
        {a.early && <Badge tone="warn">Early out</Badge>}
        <SourceBadge gpsVerified={a.gpsVerified} corrected={a.corrected} hasPunch={!!a.in} note={a.note} />
      </span>
    ),
  },
];

export function MonthNav({ month, prev, next, basePath }: { month: string; prev: string | null; next: string | null; basePath: string }) {
  return (
    <div className="flex items-center gap-1">
      {prev ? (
        <Link href={`${basePath}?month=${prev}`} className={buttonClass("ghost", "sm")} aria-label={`Previous month, ${monthLabel(prev)}`}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={`${buttonClass("ghost", "sm")} opacity-30`} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      <span className="min-w-28 text-center text-sm font-medium text-navy-900">{monthLabel(month)}</span>
      {next ? (
        <Link href={`${basePath}?month=${next}`} className={buttonClass("ghost", "sm")} aria-label={`Next month, ${monthLabel(next)}`}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={`${buttonClass("ghost", "sm")} opacity-30`} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  );
}
