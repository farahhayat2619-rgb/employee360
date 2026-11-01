import { formatDate } from "@/lib/sample-data";
import type { AttendanceDay } from "@/lib/types";

const color: Record<string, string> = {
  Present: "bg-good text-white",
  Late: "bg-warn text-white",
  "On leave": "bg-accent-500 text-white",
  Weekend: "bg-canvas text-ink-faint",
  Absent: "bg-bad text-white",
  Holiday: "bg-navy-100 text-navy-900",
  "Not punched in": "border border-dashed border-line text-ink-soft",
};

/** Month grid, Monday first. `days` are in date order; missing days (before tracking or in the future) show blank. */
export function MiniCalendar({ month, days }: { month: string; days: AttendanceDay[] }) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
        <span key={i} className="pb-1 font-medium text-ink-faint">
          {d}
        </span>
      ))}
      {Array.from({ length: firstDow }).map((_, i) => (
        <span key={`b${i}`} />
      ))}
      {Array.from({ length: count }, (_, i) => {
        const iso = `${month}-${String(i + 1).padStart(2, "0")}`;
        const d = byDate.get(iso);
        return (
          <span
            key={iso}
            title={d ? `${formatDate(iso)}: ${d.status}${d.status === "Holiday" && d.location ? ` (${d.location})` : ""}` : formatDate(iso)}
            className={`grid aspect-square place-items-center rounded-md font-medium ${d ? color[d.status] : "text-ink-faint/60"}`}
          >
            {i + 1}
          </span>
        );
      })}
    </div>
  );
}

export function CalendarLegend() {
  const items: [string, string][] = [
    ["bg-good", "Present"],
    ["bg-warn", "Late"],
    ["bg-bad", "Absent"],
    ["bg-accent-500", "Leave"],
    ["bg-navy-100", "Holiday"],
    ["bg-line", "Weekend"],
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-soft">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-sm ${c}`} /> {l}
        </span>
      ))}
    </div>
  );
}
