"use client";

import clsx from "clsx";
import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export function Tabs({ tabs, initial }: { tabs: { id: string; label: ReactNode; content: ReactNode }[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === current.id}
            onClick={() => setActive(t.id)}
            className={clsx(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              t.id === current.id ? "border-accent-600 text-accent-700" : "border-transparent text-ink-soft hover:text-navy-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current.content}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-navy-950/50" onClick={onClose} aria-label="Close" />
      <div className={clsx("animate-rise relative max-h-[90vh] w-full overflow-y-auto rounded-xl bg-surface shadow-pop", wide ? "max-w-2xl" : "max-w-lg")}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold text-navy-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-faint hover:bg-navy-50" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  const toast = msg ? (
    <div className="animate-rise fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-3 text-sm text-white shadow-pop" role="status">
      <CheckCircle2 className="size-4 text-good-50" /> {msg}
    </div>
  ) : null;
  return { show: setMsg, toast };
}
