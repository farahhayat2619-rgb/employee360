"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { createDepartment } from "@/app/actions/people";
import type { ActionResult, Option } from "@/lib/types";
import { Modal } from "./client-ui";
import { buttonClass, Field, inputClass } from "./ui";

export function DepartmentEditor({ people }: { people: Option[] }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <>
      <button
        className={buttonClass("primary")}
        onClick={() => {
          setRound((r) => r + 1); // fresh form each time
          setOpen(true);
        }}
      >
        <Plus className="size-4" /> Add department
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add department">
        <DepartmentForm key={round} people={people} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function DepartmentForm({ people, onClose }: { people: Option[]; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createDepartment, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-good-50 px-4 py-3 text-sm text-good" role="status">
          {state.message}
        </p>
        <div className="flex justify-end">
          <button type="button" className={buttonClass("primary")} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <Field label="Department name">
        <input name="name" required minLength={2} maxLength={60} className={inputClass} placeholder="e.g. Treasury" />
      </Field>
      <Field label="Department head" hint="Optional. A person can head only one department.">
        <select name="headId" defaultValue="" className={inputClass}>
          <option value="">Not assigned yet</option>
          {people.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <textarea name="description" rows={3} maxLength={300} className={inputClass} />
      </Field>
      {state && !state.ok && (
        <p className="rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad" role="alert">
          {state.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass("outline")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
