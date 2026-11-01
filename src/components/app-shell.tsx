"use client";

import clsx from "clsx";
import { Bell, ChevronDown, LogOut, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { navByRole, roleLabels } from "@/lib/nav";
import { logout } from "@/app/actions/auth";
import type { Role } from "@/lib/sample-data";
import { Avatar } from "./ui";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-accent-600 text-sm font-bold text-white">E</span>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold text-white">Employee360</p>
        <p className="text-[11px] text-navy-100/70">Crescent Bank</p>
      </div>
    </div>
  );
}

type ShellUser = { name: string; designation: string; portals: Role[] };

export function AppShell({ role, user, unread, children }: { role: Role; user: ShellUser; unread: number; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  // Close the mobile menu and user menu after navigation
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setMenu(false);
  }

  const isActive = (href: string) => {
    const base = `/${role}`;
    if (href === base) return pathname === base;
    // "Register Employee" is nested under employee records; match it exactly
    if (href === "/admin/employees") return pathname === href || (pathname.startsWith(href + "/") && !pathname.endsWith("/new"));
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sidebar = (
    <nav className="flex h-full flex-col bg-navy-900 text-navy-100" aria-label="Main">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button className="rounded-md p-1 text-navy-100 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="mx-4 mb-3 rounded-lg bg-navy-800 px-3 py-2 text-xs">
        <span className="text-navy-100/60">Portal</span>
        <p className="font-semibold text-white">{roleLabels[role]}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {navByRole[role].map((g) => (
          <div key={g.label} className="mt-4">
            <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-navy-100/45 uppercase">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const active = isActive(i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      className={clsx(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active ? "bg-accent-600 font-medium text-white" : "text-navy-100/80 hover:bg-navy-800 hover:text-white",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <i.icon className="size-4.5 shrink-0" aria-hidden />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-pop">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
        <button className="rounded-md p-2 text-navy-900 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            type="search"
            placeholder="Search employees, tickets, policies…"
            className="w-full rounded-lg border border-line bg-canvas py-2 pr-3 pl-9 text-sm focus:border-accent-500 focus:bg-surface focus:outline-none"
            aria-label="Search"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/employee/notifications" className="relative rounded-lg p-2 text-ink-soft hover:bg-navy-50" aria-label={`Notifications, ${unread} unread`}>
            <Bell className="size-5" />
            {unread > 0 && <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-bad text-[10px] font-semibold text-white">{unread}</span>}
          </Link>
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-navy-50" aria-expanded={menu} aria-label="Account menu">
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm leading-tight font-medium text-navy-900">{user.name}</span>
                <span className="block text-xs leading-tight text-ink-faint">{user.designation}</span>
              </span>
              <ChevronDown className="size-4 text-ink-faint" aria-hidden />
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-pop">
                {user.portals.length > 1 && <p className="px-3 pt-1 pb-2 text-xs text-ink-faint">Switch portal</p>}
                {user.portals.length > 1 && user.portals.map((r) => (
                  <Link key={r} href={`/${r}`} className={clsx("block rounded-lg px-3 py-2 text-sm hover:bg-navy-50", r === role && "font-semibold text-accent-700")}>
                    {roleLabels[r]} portal
                  </Link>
                ))}
                {user.portals.length > 1 && <div className="my-1 border-t border-line" />}
                <form action={logout}>
                  <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-bad hover:bg-bad-50">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-warn/20 bg-warn-50 px-4 py-1.5 text-center text-xs text-warn sm:px-6">
        Preview build: everything except Reports uses the live database. Reports still show sample figures until Phase 6.
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
