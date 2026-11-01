import { Suspense } from "react";
import { PortalGate, ShellSkeleton } from "@/components/portal-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <PortalGate portal="employee">{children}</PortalGate>
    </Suspense>
  );
}
