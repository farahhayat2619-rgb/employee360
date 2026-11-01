"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { employees } from "@/lib/sample-data";
import { Modal, useToast } from "./client-ui";
import { buttonClass, Field, inputClass } from "./ui";

export function DepartmentEditor() {
  const [open, setOpen] = useState(false);
  const { show, toast } = useToast();
  return (
    <>
      <button className={buttonClass("primary")} onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add department
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add department">
        <form
          action={(f) => {
            setOpen(false);
            show(`${f.get("name")} department created`);
          }}
          className="space-y-4"
        >
          <Field label="Department name">
            <input name="name" required className={inputClass} placeholder="e.g. Treasury" />
          </Field>
          <Field label="Department head">
            <select name="head" className={inputClass}>
              {employees.map((e) => (
                <option key={e.id}>{e.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <textarea name="desc" rows={3} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Create</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
