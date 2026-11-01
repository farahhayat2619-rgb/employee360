import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className, pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={clsx("animate-rise min-w-0 rounded-xl border border-line bg-surface shadow-card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={clsx(pad && "p-5")}>{children}</div>
    </section>
  );
}

const tones = {
  navy: "bg-navy-100 text-navy-800",
  blue: "bg-accent-100 text-accent-700",
  good: "bg-good-50 text-good",
  warn: "bg-warn-50 text-warn",
  bad: "bg-bad-50 text-bad",
  grey: "bg-canvas text-ink-soft",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "grey", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone])}>{children}</span>;
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (["approved", "present", "completed", "resolved", "closed", "active", "published", "verified"].includes(s)) return "good";
  if (["pending", "late", "in progress", "cancel requested", "on leave", "to do"].includes(s)) return "warn";
  if (["rejected", "absent", "inactive", "high", "open"].includes(s)) return s === "open" ? "blue" : "bad";
  return "grey";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

const buttonStyles = {
  primary: "bg-navy-900 text-white hover:bg-navy-700",
  accent: "bg-accent-600 text-white hover:bg-accent-700",
  outline: "border border-line bg-surface text-navy-900 hover:bg-navy-50",
  ghost: "text-ink-soft hover:bg-navy-50 hover:text-navy-900",
  danger: "bg-bad text-white hover:opacity-90",
} as const;

export function buttonClass(variant: keyof typeof buttonStyles = "primary", size: "sm" | "md" = "md") {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
    buttonStyles[variant],
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "navy" }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: Tone }) {
  return (
    <div className="animate-rise flex items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className={clsx("grid size-10 shrink-0 place-items-center rounded-lg", tones[tone])}>
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-navy-900 tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      </div>
    </div>
  );
}

export function Progress({ value, tone = "blue" }: { value: number; tone?: "blue" | "good" | "warn" }) {
  const bar = tone === "good" ? "bg-good" : tone === "warn" ? "bg-warn" : "bg-accent-600";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-navy-50" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("h-full rounded-full transition-all", bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, size = "md", src }: { name: string; size?: "sm" | "md" | "lg"; src?: string | null }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const s = size === "lg" ? "size-20 text-2xl" : size === "sm" ? "size-8 text-xs" : "size-10 text-sm";
  // eslint-disable-next-line @next/next/no-img-element -- small same-origin photo from our own API
  if (src) return <img src={src} alt={name} className={clsx("shrink-0 rounded-full object-cover", s)} />;
  return <span className={clsx("grid shrink-0 place-items-center rounded-full bg-navy-800 font-semibold text-white", s)}>{initials}</span>;
}

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; className?: string };

export function DataTable<T>({ columns, rows, rowKey, empty = "Nothing to show yet." }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; empty?: string }) {
  if (rows.length === 0) return <p className="px-5 py-10 text-center text-sm text-ink-faint">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-navy-50/60">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={clsx("px-5 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-soft uppercase", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-line last:border-0 hover:bg-navy-50/40">
              {columns.map((c) => (
                <td key={c.key} className={clsx("px-5 py-3 align-middle text-ink", c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent-500 focus:ring-2 focus:ring-accent-100 focus:outline-none";

export function KeyValue({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-medium text-ink-faint">{i.label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
