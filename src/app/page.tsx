import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-accent-600 font-bold">E</span>
          <div>
            <p className="font-semibold">Employee360</p>
            <p className="text-xs text-navy-100/70">Crescent Bank</p>
          </div>
        </div>
        <div className="mt-auto max-w-md">
          <h1 className="text-4xl leading-tight font-semibold">Everything about work, in one secure place.</h1>
          <p className="mt-4 text-navy-100/80">Attendance, leave, payroll, goals, policies and support for every Crescent Bank employee, manager and HR team member.</p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6 text-sm">
            <div>
              <dt className="text-navy-100/60">Employees</dt>
              <dd className="mt-1 text-2xl font-semibold">60</dd>
            </div>
            <div>
              <dt className="text-navy-100/60">Departments</dt>
              <dd className="mt-1 text-2xl font-semibold">6</dd>
            </div>
            <div>
              <dt className="text-navy-100/60">Offices</dt>
              <dd className="mt-1 text-2xl font-semibold">2</dd>
            </div>
          </dl>
        </div>
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-accent-600/20 blur-3xl" />
      </div>

      <div className="flex items-center justify-center bg-canvas px-4 py-12 sm:px-8">
        <Suspense fallback={<div className="h-[520px] w-full max-w-md animate-pulse rounded-2xl bg-surface" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
