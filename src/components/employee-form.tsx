"use client";

import { useRouter } from "next/navigation";
import { departments, employees, offices, type Employee } from "@/lib/sample-data";
import { useToast } from "./client-ui";
import { buttonClass, Card, Field, inputClass } from "./ui";

export function EmployeeForm({ existing }: { existing?: Employee }) {
  const router = useRouter();
  const { show, toast } = useToast();
  const nextId = `EMP-${Math.max(...employees.map((e) => Number(e.id.slice(4)))) + 1}`;

  return (
    <form
      action={(f) => {
        show(existing ? "Employee record updated" : `${f.get("name")} registered as ${nextId}. Login invite sent.`);
        setTimeout(() => router.push("/admin/employees"), 1200);
      }}
      className="space-y-6"
    >
      <Card title="Personal details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input name="name" required defaultValue={existing?.name} className={inputClass} />
          </Field>
          <Field label="Employee ID" hint={existing ? undefined : "Generated automatically"}>
            <input value={existing?.id ?? nextId} readOnly className={`${inputClass} bg-canvas`} />
          </Field>
          <Field label="Work email">
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
            <select name="dept" required defaultValue={existing?.department} className={inputClass}>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Designation">
            <input name="designation" required defaultValue={existing?.designation} className={inputClass} />
          </Field>
          <Field label="Reporting manager">
            <select name="manager" defaultValue={existing?.manager} className={inputClass}>
              {employees.filter((e) => e.role !== "employee").map((e) => (
                <option key={e.id}>{e.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Joining date">
            <input name="joined" type="date" required defaultValue={existing?.joiningDate} className={inputClass} />
          </Field>
          <Field label="Office (for attendance geofence)">
            <select name="office" defaultValue={existing?.office} className={inputClass}>
              {offices.map((o) => (
                <option key={o.id}>{o.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Employment type">
            <select name="type" defaultValue={existing?.type} className={inputClass}>
              <option>Permanent</option>
              <option>Contract</option>
            </select>
          </Field>
          <Field label="Portal role">
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
          {["Basic salary", "House rent allowance", "Transport allowance", "Medical allowance"].map((l, i) => (
            <Field key={l} label={l}>
              <input name={`pay${i}`} type="number" min={0} step={500} required className={inputClass} defaultValue={existing ? [185000, 74000, 15000, 18500][i] : undefined} />
            </Field>
          ))}
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={() => router.back()}>Cancel</button>
        <button type="submit" className={buttonClass("primary")}>{existing ? "Save changes" : "Register employee"}</button>
      </div>
      {toast}
    </form>
  );
}
