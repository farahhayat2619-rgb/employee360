"use client";

import { Camera, Mail, MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { useActionState, useRef, useState, useTransition } from "react";
import { removeMyPhoto, updateMyContact, updateMyPhoto } from "@/app/actions/profile";
import type { MyProfile } from "@/lib/profile";
import { formatDate } from "@/lib/sample-data";
import type { ActionResult } from "@/lib/types";
import { Modal, useToast, keepOnSubmit } from "./client-ui";
import { Avatar, Badge, buttonClass, Card, Field, inputClass, KeyValue, PageHeader } from "./ui";

export function ProfileView({ me }: { me: MyProfile }) {
  const [edit, setEdit] = useState<number | null>(null);
  const { show, toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoState, photoAction, photoPending] = useActionState<ActionResult, FormData>(async (prev, f) => {
    const r = await updateMyPhoto(prev, f);
    if (r) show(r.message);
    return r;
  }, undefined);
  const [removing, startRemove] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="HR keeps your employment details up to date. You can change your contact details and photo."
        actions={
          <button className={buttonClass("outline")} onClick={() => setEdit(Date.now())}>
            <Pencil className="size-4" /> Edit contact details
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar name={me.name} size="lg" src={me.photo} />
              <form ref={formRef} action={photoAction}>
                <input ref={fileRef} name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={() => formRef.current?.requestSubmit()} aria-label="Choose profile photo" />
                <button
                  type="button"
                  disabled={photoPending}
                  className="absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border-2 border-white bg-accent-600 text-white disabled:opacity-60"
                  aria-label="Change photo"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="size-3.5" />
                </button>
              </form>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-navy-900">{me.name}</h2>
            <p className="text-sm text-ink-soft">{me.designation}</p>
            <div className="mt-2 flex gap-2">
              <Badge tone="navy">{me.id}</Badge>
              <Badge tone={me.status === "Active" ? "good" : "warn"}>{me.status}</Badge>
            </div>
            <p className="mt-3 text-xs text-ink-faint">{photoPending ? "Uploading…" : "JPG, PNG or WebP, up to 500 KB"}</p>
            {photoState && !photoState.ok && (
              <p className="mt-2 text-xs text-bad" role="alert">
                {photoState.message}
              </p>
            )}
            {me.photo && (
              <button
                disabled={removing}
                className={`${buttonClass("ghost", "sm")} mt-1`}
                onClick={() =>
                  startRemove(async () => {
                    const r = await removeMyPhoto();
                    if (r) show(r.message);
                  })
                }
              >
                <Trash2 className="size-3.5" /> Remove photo
              </button>
            )}
          </div>
          <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <li className="flex items-center gap-3 text-ink-soft">
              <Mail className="size-4 shrink-0 text-ink-faint" /> <span className="truncate">{me.email}</span>
            </li>
            <li className="flex items-center gap-3 text-ink-soft">
              <Phone className="size-4 shrink-0 text-ink-faint" /> {me.phone}
            </li>
            <li className="flex items-center gap-3 text-ink-soft">
              <MapPin className="size-4 shrink-0 text-ink-faint" /> {me.office}
            </li>
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
                { label: "Working hours", value: me.hours },
              ]}
            />
          </Card>
          <Card title="Contact details">
            <KeyValue
              items={[
                { label: "Work email", value: me.email },
                { label: "Mobile", value: me.phone },
                { label: "Home address", value: me.address || "Not added yet" },
                { label: "Emergency contact", value: me.emergencyContact || "Not added yet" },
              ]}
            />
          </Card>
        </div>
      </div>

      <Modal open={edit !== null} onClose={() => setEdit(null)} title="Edit contact details">
        {edit !== null && (
          <ContactForm
            key={edit}
            me={me}
            onClose={() => setEdit(null)}
            onDone={(m) => {
              setEdit(null);
              show(m);
            }}
          />
        )}
      </Modal>
      {toast}
    </>
  );
}

function ContactForm({ me, onClose, onDone }: { me: MyProfile; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (prev, f) => {
    const r = await updateMyContact(prev, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <Field label="Mobile">
        <input name="phone" required pattern="^\+?[0-9 ]{10,16}$" defaultValue={me.phone} className={inputClass} />
      </Field>
      <Field label="Home address">
        <input name="address" required minLength={5} maxLength={200} defaultValue={me.address} className={inputClass} />
      </Field>
      <Field label="Emergency contact" hint="Name, relationship and phone number">
        <input name="emergencyContact" required minLength={5} maxLength={120} defaultValue={me.emergencyContact} className={inputClass} />
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
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
