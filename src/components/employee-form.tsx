"use client";

import { Copy, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { saveEmployee } from "@/app/actions/people";
import type { ActionResult, EditableEmployee, Option } from "@/lib/types";
import { buttonClass, Card, Field, inputClass } from "./ui";

export function EmployeeForm({ existing, nextId, departments, offices, managers }: { existing: EditableEmployee | null; nextId: string; departments: Option[]; offices: Option[]; managers: Option[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionResult, FormData>(saveEmployee, undefined);
  const [copied, setCopied] = useState(false);

  if (state?.ok && state.tempPassword) {
    return (
      <Card className="max-w-xl">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-good-50 text-good">
            <KeyRound className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-navy-900">{state.message}</p>
            <p className="mt-1 text-sm text-ink-soft">Give them this one-time password in person or over the phone. It is shown only once and is not stored anywhere readable.</p>
            <div className="mt-4 flex items-center gap-2">
              <code className="rounded-lg bg-navy-50 px-3 py-2 font-mono text-base tracking-wider text-navy-900">{state.tempPassword}</code>
              <button
                type="button"
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  navigator.clipboard?.writeText(state.tempPassword!).then(() => setCopied(true), () => setCopied(false));
                }}
              >
                <Copy className="size-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-6 flex gap-2">
              <Link href="/admin/employees" className={buttonClass("primary")}>
                Back to employee records
              </Link>
              <button type="button" className={buttonClass("outline")} onClick={() => router.refresh()}>
                Register another
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const s = existing?.salary;
  return (
    <form action={action} className="space-y-6">
      {existing && <input type="hidden" name="id" value={existing.id} />}
      <Card title="Personal details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input name="name" required minLength={3} defaultValue={existing?.name} className={inputClass} />
          </Field>
          <Field label="Employee ID" hint={existing ? undefined : "Assigned automatically when you save"}>
            <input value={existing?.id ?? nextId} readOnly className={`${inputClass} bg-canvas`} aria-readonly />
          </Field>
          <Field label="Work email" hint="They sign in with this email.">
            <input name="email" type="email" required defaultValue={existing?.email} className={inputClass} placeholder="name@crescentbank.example" />
          </Field>
          <Field label="Mobile">
            <input name="phone" required pattern="^\+?[0-9 ]{10,16}$" defaultValue={existing?.phone} className={inputClass} placeholder="+92 300 555 0000" />
          </Field>
        </div>
      </Card>
      <Card title="Employment">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Department">
            <select name="departmentId" required defaultValue={existing?.departmentId ?? ""} className={inputClass}>
              <option value="" disabled>
                Choose a department
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Designation">
            <input name="designation" required defaultValue={existing?.designation} className={inputClass} />
          </Field>
          <Field label="Reporting manager">
            <select name="managerId" defaultValue={existing?.managerId ?? ""} className={inputClass}>
              <option value="">No manager</option>
              {managers
                .filter((m) => m.id !== existing?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Joining date">
            <input name="joiningDate" type="date" required defaultValue={existing?.joiningDate} className={inputClass} />
          </Field>
          <Field label="Office (for attendance geofence)">
            <select name="officeId" required defaultValue={existing?.officeId ?? ""} className={inputClass}>
              <option value="" disabled>
                Choose an office
              </option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employment type">
            <select name="type" defaultValue={existing?.type ?? "PERMANENT"} className={inputClass}>
              <option value="PERMANENT">Permanent</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </Field>
          <Field label="Portal role" hint="Controls which portals they can open.">
            <select name="role" defaultValue={existing?.role ?? "employee"} className={inputClass}>
              <option value="employee">Employee</option>
              <option value="management">Management</option>
              <option value="admin">Admin / HR</option>
            </select>
          </Field>
        </div>
      </Card>
      <Card title="Salary structure (monthly, PKR)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Basic salary">
            <input name="basic" type="number" min={0} step={500} required className={inputClass} defaultValue={s?.basic} />
          </Field>
          <Field label="House rent allowance">
            <input name="house" type="number" min={0} step={500} required className={inputClass} defaultValue={s?.house} />
          </Field>
          <Field label="Transport allowance">
            <input name="transport" type="number" min={0} step={500} required className={inputClass} defaultValue={s?.transport} />
          </Field>
          <Field label="Medical allowance">
            <input name="medical" type="number" min={0} step={500} required className={inputClass} defaultValue={s?.medical} />
          </Field>
        </div>
      </Card>
      {state && !state.ok && (
        <p className="rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad" role="alert">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-good-50 px-4 py-3 text-sm text-good" role="status">
          {state.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Link href="/admin/employees" className={buttonClass("outline")}>
          Cancel
        </Link>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : existing ? "Save changes" : "Register employee"}
        </button>
      </div>
    </form>
  );
}
