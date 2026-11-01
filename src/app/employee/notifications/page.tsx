"use client";

import clsx from "clsx";
import { Bell, CalendarCheck, CalendarDays, ClipboardList, Megaphone, PartyPopper, Ticket, Wallet } from "lucide-react";
import { useState } from "react";
import { Tabs } from "@/components/client-ui";
import { Badge, buttonClass, Card, PageHeader } from "@/components/ui";
import { announcements, formatDate, notifications as seed } from "@/lib/sample-data";

const icon = { Leave: CalendarDays, Attendance: CalendarCheck, Announcement: Megaphone, Holiday: PartyPopper, Ticket, Task: ClipboardList, Payroll: Wallet } as const;

export default function NotificationsPage() {
  const [list, setList] = useState(seed);
  const unread = list.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications & Announcements"
        subtitle="Reminders, approvals and news from HR and the company."
        actions={
          <button className={buttonClass("outline")} disabled={unread === 0} onClick={() => setList((l) => l.map((n) => ({ ...n, read: true })))}>
            Mark all as read
          </button>
        }
      />
      <Tabs
        tabs={[
          {
            id: "n",
            label: `My notifications${unread ? ` (${unread})` : ""}`,
            content: (
              <Card pad={false}>
                <ul className="divide-y divide-line">
                  {list.map((n) => {
                    const Icon = icon[n.type] ?? Bell;
                    return (
                      <li key={n.id}>
                        <button onClick={() => setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))} className={clsx("flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-navy-50/50", !n.read && "bg-accent-50/60")}>
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-800">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={clsx("block text-sm", !n.read ? "font-semibold text-navy-900" : "text-ink")}>{n.message}</span>
                            <span className="text-xs text-ink-faint">
                              {n.type} · {n.time}
                            </span>
                          </span>
                          {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent-600" aria-label="Unread" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ),
          },
          {
            id: "a",
            label: "Announcements",
            content: (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <Card key={a.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={a.type === "Important" ? "bad" : a.type === "Holiday" ? "good" : a.type === "HR" ? "navy" : "blue"}>{a.type}</Badge>
                      <span className="text-xs text-ink-faint">
                        {formatDate(a.date)} · {a.author}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-navy-900">{a.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{a.body}</p>
                  </Card>
                ))}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
