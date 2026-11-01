"use client";

import clsx from "clsx";
import { Briefcase, Eye, EyeOff, Lock, ShieldCheck, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import type { Role } from "@/lib/sample-data";

const roles: { id: Role; label: string; icon: typeof Briefcase; email: string }[] = [
  { id: "employee", label: "Employee", icon: Briefcase, email: "ayesha.khan@crescentbank.example" },
  { id: "management", label: "Management", icon: UserCog, email: "imran.siddiqui@crescentbank.example" },
  { id: "admin", label: "Admin / HR", icon: ShieldCheck, email: "sana.malik@crescentbank.example" },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("employee");
  const [show, setShow] = useState(false);
  const current = roles.find((r) => r.id === role)!;

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
        <div className="animate-rise w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-card">
          <h2 className="text-2xl font-semibold text-navy-900">Sign in</h2>
          <p className="mt-1 text-sm text-ink-soft">Choose your portal and sign in with your work email.</p>

          <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Portal">
            {roles.map((r) => (
              <button
                key={r.id}
                role="radio"
                aria-checked={role === r.id}
                onClick={() => setRole(r.id)}
                className={clsx(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors",
                  role === r.id ? "border-accent-600 bg-accent-50 text-accent-700" : "border-line text-ink-soft hover:border-navy-100",
                )}
              >
                <r.icon className="size-5" />
                {r.label}
              </button>
            ))}
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/${role}`);
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-soft">Work email</span>
              <input key={role} type="email" required defaultValue={current.email} className={inputClass} autoComplete="username" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-soft">Password</span>
              <span className="relative block">
                <input type={show ? "text" : "password"} required defaultValue="demo-password" className={inputClass} autoComplete="current-password" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-ink-faint" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-soft">
                <input type="checkbox" className="accent-accent-600" /> Keep me signed in
              </label>
              <a href="#" className="font-medium text-accent-700 hover:underline">
                Forgot password?
              </a>
            </div>
            <button type="submit" className={clsx(buttonClass("primary"), "w-full py-2.5")}>
              <Lock className="size-4" /> Sign in to {current.label} portal
            </button>
          </form>
          <p className="mt-6 rounded-lg bg-warn-50 px-3 py-2 text-xs text-warn">Design preview: any password works. Secure login with hashed passwords and sessions is built in Phase 2.</p>
        </div>
      </div>
    </div>
  );
}
