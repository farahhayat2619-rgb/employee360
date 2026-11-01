"use client";

import { Crosshair, MapPin, Plus } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { saveOffice } from "@/app/actions/settings";
import type { ActionResult } from "@/lib/types";
import { keepOnSubmit, Modal, Tabs, useToast } from "./client-ui";
import { buttonClass, Card, Field, inputClass, KeyValue, PageHeader } from "./ui";

export type OfficeRow = { id: string; name: string; address: string; latitude: number; longitude: number; radiusM: number; workStart: string; workEnd: string; graceMin: number; staff: number };

function OfficeForm({ office, onClose, onDone }: { office: OfficeRow | null; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (p, f) => {
    const r = await saveOffice(p, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
  const lat = useRef<HTMLInputElement>(null);
  const lng = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState<string | null>(null);

  // Fills the coordinates from this device's GPS, for an admin standing in the office.
  const useHere = () => {
    if (!navigator.geolocation) return setLocating("This browser can't share its location.");
    setLocating("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (lat.current) lat.current.value = p.coords.latitude.toFixed(6);
        if (lng.current) lng.current.value = p.coords.longitude.toFixed(6);
        setLocating(`Filled from your device, accurate to about ${Math.round(p.coords.accuracy)} m.`);
      },
      (e) => setLocating(e.code === e.PERMISSION_DENIED ? "Location permission was refused. Type the coordinates instead." : "Couldn't get your location. Type the coordinates instead."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      {office && <input type="hidden" name="id" value={office.id} />}
      <Field label="Office name">
        <input name="name" required minLength={3} maxLength={80} defaultValue={office?.name} className={inputClass} />
      </Field>
      <Field label="Address">
        <input name="address" required minLength={5} maxLength={200} defaultValue={office?.address} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Latitude">
          <input ref={lat} name="latitude" type="number" step="0.000001" min={-90} max={90} required defaultValue={office?.latitude} className={inputClass} />
        </Field>
        <Field label="Longitude">
          <input ref={lng} name="longitude" type="number" step="0.000001" min={-180} max={180} required defaultValue={office?.longitude} className={inputClass} />
        </Field>
        <Field label="Radius (metres)" hint="50 to 500 m">
          <input name="radiusM" type="number" min={50} max={500} required defaultValue={office?.radiusM ?? 100} className={inputClass} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={useHere} className={buttonClass("outline", "sm")}>
          <Crosshair className="size-3.5" /> Use my current location
        </button>
        {locating && <span className="text-xs text-ink-soft">{locating}</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Work starts">
          <input name="workStart" type="time" required defaultValue={office?.workStart ?? "09:00"} className={inputClass} />
        </Field>
        <Field label="Work ends">
          <input name="workEnd" type="time" required defaultValue={office?.workEnd ?? "17:00"} className={inputClass} />
        </Field>
        <Field label="Late grace (minutes)">
          <input name="graceMin" type="number" min={0} max={60} required defaultValue={office?.graceMin ?? 15} className={inputClass} />
        </Field>
      </div>
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
          {pending ? "Saving…" : "Save office"}
        </button>
      </div>
    </form>
  );
}

export function SettingsView({ offices }: { offices: OfficeRow[] }) {
  const [edit, setEdit] = useState<{ office: OfficeRow | null; round: number } | null>(null);
  const { show, toast } = useToast();

  return (
    <>
      <PageHeader title="System Settings" subtitle="Office geofences and working hours used by GPS attendance, plus company details." />
      <Tabs
        tabs={[
          {
            id: "o",
            label: "Offices & geofencing",
            content: (
              <>
                <div className="mb-4 flex justify-end">
                  <button className={buttonClass("primary")} onClick={() => setEdit({ office: null, round: Date.now() })}>
                    <Plus className="size-4" /> Add office
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {offices.map((o) => (
                    <Card key={o.id}>
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-700">
                          <MapPin className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-navy-900">{o.name}</p>
                          <p className="text-sm text-ink-soft">{o.address}</p>
                        </div>
                        <button className={buttonClass("outline", "sm")} onClick={() => setEdit({ office: o, round: Date.now() })} aria-label={`Edit ${o.name}`}>
                          Edit
                        </button>
                      </div>
                      <div className="mt-4 grid place-items-center rounded-lg bg-navy-50 py-6">
                        <div className="relative grid size-28 place-items-center rounded-full border-2 border-dashed border-accent-500 bg-accent-100/50">
                          <MapPin className="size-6 text-accent-700" />
                          <span className="absolute -bottom-6 text-xs font-medium text-accent-700">{o.radiusM} m radius</span>
                        </div>
                      </div>
                      <dl className="mt-8 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <div>
                          <dt className="text-ink-faint">Coordinates</dt>
                          <dd className="font-mono">
                            {o.latitude.toFixed(4)}, {o.longitude.toFixed(4)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-faint">Hours</dt>
                          <dd>
                            {o.workStart} – {o.workEnd}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-faint">Late after</dt>
                          <dd>{o.graceMin} min grace</dd>
                        </div>
                        <div>
                          <dt className="text-ink-faint">Staff</dt>
                          <dd>{o.staff} assigned</dd>
                        </div>
                      </dl>
                    </Card>
                  ))}
                </div>
              </>
            ),
          },
          {
            id: "c",
            label: "Company",
            content: (
              <Card className="max-w-2xl" title="Company details">
                <KeyValue
                  items={[
                    { label: "Company name", value: "Crescent Bank" },
                    { label: "Currency", value: "PKR" },
                    { label: "Time zone", value: "Asia/Karachi (UTC+5)" },
                    { label: "Working days", value: "Monday to Friday, minus public holidays" },
                    { label: "Sign-in session", value: "Signs out after 30 minutes without activity, and always after 12 hours" },
                  ]}
                />
                <p className="mt-4 text-xs text-ink-faint">These are fixed for this build. Public holidays are managed under Leave Management.</p>
              </Card>
            ),
          },
        ]}
      />
      <Modal open={edit !== null} onClose={() => setEdit(null)} title={edit?.office ? `Edit ${edit.office.name}` : "Add office"} wide>
        {edit && (
          <OfficeForm
            key={edit.round}
            office={edit.office}
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
