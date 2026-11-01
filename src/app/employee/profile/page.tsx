"use client";

import { Camera, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { useState } from "react";
import { Modal, useToast } from "@/components/client-ui";
import { Avatar, Badge, buttonClass, Card, Field, inputClass, KeyValue, PageHeader } from "@/components/ui";
import { currentUsers, employeeById, formatDate } from "@/lib/sample-data";

export default function ProfilePage() {
  const me = employeeById(currentUsers.employee);
  const [contact, setContact] = useState({ phone: me.phone, address: "House 14, Block 5, Clifton, Karachi", emergency: "Faisal Khan (brother) · +92 321 555 0199" });
  const [edit, setEdit] = useState(false);
  const { show, toast } = useToast();

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="HR keeps your employment details up to date. You can change your contact details and photo."
        actions={
          <button className={buttonClass("outline")} onClick={() => setEdit(true)}>
            <Pencil className="size-4" /> Edit contact details
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar name={me.name} size="lg" />
              <button className="absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border-2 border-white bg-accent-600 text-white" aria-label="Change photo" onClick={() => show("Photo upload arrives with file storage in Phase 4")}>
                <Camera className="size-3.5" />
              </button>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-navy-900">{me.name}</h2>
            <p className="text-sm text-ink-soft">{me.designation}</p>
            <div className="mt-2 flex gap-2">
              <Badge tone="navy">{me.id}</Badge>
              <Badge tone="good">{me.status}</Badge>
            </div>
          </div>
          <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <li className="flex items-center gap-3 text-ink-soft"><Mail className="size-4 shrink-0 text-ink-faint" /> <span className="truncate">{me.email}</span></li>
            <li className="flex items-center gap-3 text-ink-soft"><Phone className="size-4 shrink-0 text-ink-faint" /> {contact.phone}</li>
            <li className="flex items-center gap-3 text-ink-soft"><MapPin className="size-4 shrink-0 text-ink-faint" /> {me.office}</li>
          </ul>
        </Card>

        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title="Employment information">
            <KeyValue
              items={[
                { label: "Employee ID", value: me.id },
                { label: "Department", value: me.department },
                { label: "Designation", value: me.designation },
                { label: "Reporting manager", value: me.manager },
                { label: "Joining date", value: formatDate(me.joiningDate, { day: "numeric", month: "long", year: "numeric" }) },
                { label: "Employment type", value: me.type },
                { label: "Work location", value: me.office },
                { label: "Working hours", value: "09:00 – 17:00, Monday to Friday" },
              ]}
            />
          </Card>
          <Card title="Contact details">
            <KeyValue
              items={[
                { label: "Work email", value: me.email },
                { label: "Mobile", value: contact.phone },
                { label: "Home address", value: contact.address },
                { label: "Emergency contact", value: contact.emergency },
              ]}
            />
          </Card>
        </div>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title="Edit contact details">
        <form
          action={(f) => {
            setContact({ phone: String(f.get("phone")), address: String(f.get("address")), emergency: String(f.get("emergency")) });
            setEdit(false);
            show("Contact details updated");
          }}
          className="space-y-4"
        >
          <Field label="Mobile">
            <input name="phone" required pattern="^\+?[0-9 ]{10,16}$" defaultValue={contact.phone} className={inputClass} />
          </Field>
          <Field label="Home address">
            <input name="address" required defaultValue={contact.address} className={inputClass} />
          </Field>
          <Field label="Emergency contact">
            <input name="emergency" required defaultValue={contact.emergency} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setEdit(false)}>Cancel</button>
            <button type="submit" className={buttonClass("primary")}>Save changes</button>
          </div>
        </form>
      </Modal>
      {toast}
    </>
  );
}
