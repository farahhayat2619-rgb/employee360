import type { ReactNode } from "react";
import { requirePortal } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/sample-data";
import { AppShell } from "./app-shell";

/** Checks the session and role on the server, then renders the portal chrome for the signed-in user. */
export async function PortalGate({ portal, children }: { portal: Role; children: ReactNode }) {
  const user = await requirePortal(portal);
  const unread = await db.notification.count({ where: { employeeId: user.employeeId, read: false } });
  return (
    <AppShell role={portal} user={{ name: user.name, designation: user.designation, portals: user.portals }} unread={unread}>
      {children}
    </AppShell>
  );
}

export function ShellSkeleton() {
  return (
    <div className="min-h-screen lg:pl-64">
      <div className="fixed inset-y-0 left-0 hidden w-64 bg-navy-900 lg:block" />
      <div className="h-16 border-b border-line bg-surface" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
        <div className="h-8 w-64 animate-pulse rounded bg-line" />
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
        <div className="h-64 animate-pulse rounded-xl bg-surface" />
      </div>
    </div>
  );
}
