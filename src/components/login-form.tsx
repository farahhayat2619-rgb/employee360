"use client";

import clsx from "clsx";
import { Briefcase, Eye, EyeOff, Loader2, Lock, ShieldCheck, UserCog } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import type { Role } from "@/lib/sample-data";
import { buttonClass, inputClass } from "./ui";

const roles: { id: Role; label: string; icon: typeof Briefcase }[] = [
  { id: "employee", label: "Employee", icon: Briefcase },
  { id: "management", label: "Management", icon: UserCog },
  { id: "admin", label: "Admin / HR", icon: ShieldCheck },
];

const notices: Record<string, string> = {
  required: "Please sign in to continue.",
  signedout: "You've been signed out.",
};

export function LoginForm() {
  const params = useSearchParams();
  const [role, setRole] = useState<Role>("employee");
  const [show, setShow] = useState(false);
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const current = roles.find((r) => r.id === role)!;
  const notice = params.get("signedout") ? notices.signedout : params.get("signin") ? notices.required : null;

  return (
    <div className="animate-rise w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-card">
      <h2 className="text-2xl font-semibold text-navy-900">Sign in</h2>
      <p className="mt-1 text-sm text-ink-soft">Choose your portal and sign in with your work email.</p>

      {notice && !state?.error && <p className="mt-4 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{notice}</p>}

      <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Portal">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
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

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="portal" value={role} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Work email</span>
          <input name="email" type="email" required defaultValue={state?.email} className={inputClass} autoComplete="username" placeholder="name@crescentbank.example" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Password</span>
          <span className="relative block">
            <input name="password" type={show ? "text" : "password"} required className={inputClass} autoComplete="current-password" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-ink-faint" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </label>
        {state?.error && (
          <p className="rounded-lg bg-bad-50 px-3 py-2 text-sm text-bad" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className={clsx(buttonClass("primary"), "w-full py-2.5")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Sign in to {current.label} portal
        </button>
        <p className="text-center text-xs text-ink-faint">Forgot your password? Contact HR to reset it.</p>
      </form>
    </div>
  );
}
