"use client";

import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import { Modal, useToast } from "@/components/client-ui";
import { buttonClass, Card, DataTable, Field, inputClass, PageHeader } from "@/components/ui";
import { formatDate, policies as seed } from "@/lib/sample-data";

const cats = ["HR Policies", "Attendance Policies", "Leave Policies", "Code of Conduct", "Employee Handbook", "Policy Documents"];

export default function AdminPolicies() {
  const [list, setList] = useState(seed);
  const [open, setOpen] = useState(false);
  const { show, toast } = useToast();
  return (
    <>
      <PageHeader title="Company Policies" subtitle="Upload new policies or new versions. Employees always see the latest version." actions={<button className={buttonClass("primary")} onClick={() => setOpen(true)}><Upload className="size-4" /> Upload policy</button>} />
      <Card pad={false}>
        <DataTable
          rows={list}
          rowKey={(p) => p.id}
          columns={[
            { key: "t", header: "Policy", cell: (p) => <span className="flex items-center gap-2"><FileText className="size-4 text-bad" /><span className="font-medium text-navy-900">{p.title}</span></span> },
            { key: "c", header: "Category", cell: (p) => p.category },
            { key: "v", header: "Version", cell: (p) => p.version },
            { key: "u", header: "Updated", cell: (p) => formatDate(p.updated), className: "whitespace-nowrap" },
            { key: "a", header: "", cell: (p) => <button className={buttonClass("ghost", "sm")} onClick={() => show(`Upload a new version of ${p.title} (file storage arrives in Phase 4)`)}>New version</button> },
          ]}
        />
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Upload policy">
        <form
          action={(f) => {
            setList((l) => [{ id: `POL-${String(l.length + 1).padStart(2, "0")}`, title: String(f.get("title")), category: String(f.get("cat")), version: String(f.get("version")), updated: "2026-11-02", pages: 1 }, ...l]);
            setOpen(false);
            show("Policy published to all employees");
          }}
          className="space-y-4"
        >
          <Field label="Title"><input name="title" required className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><select name="cat" className={inputClass}>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Version"><input name="version" required defaultValue="v1.0" className={inputClass} /></Field>
          </div>
          <Field label="Document (PDF)" hint="Stored securely once file storage is connected in Phase 4."><input type="file" accept="application/pdf" className={inputClass} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Publish</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
