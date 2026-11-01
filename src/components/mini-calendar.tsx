import { formatDate, myAttendance } from "@/lib/sample-data";

export function MiniCalendar() {
  const days = [...myAttendance].reverse();
  const firstDow = (new Date("2026-10-01T12:00:00Z").getUTCDay() + 6) % 7; // Monday first
  const color: Record<string, string> = { Present: "bg-good text-white", Late: "bg-warn text-white", "On leave": "bg-accent-500 text-white", Weekend: "bg-canvas text-ink-faint", Absent: "bg-bad text-white", Holiday: "bg-navy-100" };
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
      {days.map((d) => (
        <span key={d.date} title={`${formatDate(d.date)}: ${d.status}`} className={`grid aspect-square place-items-center rounded-md font-medium ${color[d.status]}`}>
          {Number(d.date.slice(8))}
        </span>
      ))}
    </div>
  );
}
