"use client";

import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { Modal, Tabs, useToast } from "@/components/client-ui";
import { buttonClass, Card, Field, inputClass, PageHeader } from "@/components/ui";
import { offices as seed, type Office } from "@/lib/sample-data";

function OfficeForm({ office, onSave }: { office?: Office; onSave: (o: Office) => void }) {
  return (
    <form
      action={(f) =>
        onSave({
          id: office?.id ?? `o${Date.now()}`,
          name: String(f.get("name")),
          address: String(f.get("address")),
          lat: Number(f.get("lat")),
          lng: Number(f.get("lng")),
          radius: Number(f.get("radius")),
          start: String(f.get("start")),
          end: String(f.get("end")),
          grace: Number(f.get("grace")),
        })
      }
      className="space-y-4"
    >
      <Field label="Office name"><input name="name" required defaultValue={office?.name} className={inputClass} /></Field>
      <Field label="Address"><input name="address" required defaultValue={office?.address} className={inputClass} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Latitude"><input name="lat" type="number" step="0.000001" min={-90} max={90} required defaultValue={office?.lat} className={inputClass} /></Field>
        <Field label="Longitude"><input name="lng" type="number" step="0.000001" min={-180} max={180} required defaultValue={office?.lng} className={inputClass} /></Field>
        <Field label="Radius (metres)" hint="50 to 500 m"><input name="radius" type="number" min={50} max={500} required defaultValue={office?.radius ?? 100} className={inputClass} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Work starts"><input name="start" type="time" required defaultValue={office?.start ?? "09:00"} className={inputClass} /></Field>
        <Field label="Work ends"><input name="end" type="time" required defaultValue={office?.end ?? "17:00"} className={inputClass} /></Field>
        <Field label="Late grace (minutes)"><input name="grace" type="number" min={0} max={60} required defaultValue={office?.grace ?? 15} className={inputClass} /></Field>
      </div>
      <p className="text-xs text-ink-faint">Phase 3 adds a map so you can drop the pin and drag the radius instead of typing coordinates.</p>
      <div className="flex justify-end">
        <button type="submit" className={buttonClass("primary")}>Save office</button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const [offices, setOffices] = useState(seed);
  const [edit, setEdit] = useState<Office | "new" | null>(null);
  const { show, toast } = useToast();

  return (
    <>
      <PageHeader title="System Settings" subtitle="Office geofences, working hours and company details." />
      <Tabs
        tabs={[
          {
            id: "o",
            label: "Offices & geofencing",
            content: (
              <>
                <div className="mb-4 flex justify-end">
                  <button className={buttonClass("primary")} onClick={() => setEdit("new")}><Plus className="size-4" /> Add office</button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {offices.map((o) => (
                    <Card key={o.id}>
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-700"><MapPin className="size-5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-navy-900">{o.name}</p>
                          <p className="text-sm text-ink-soft">{o.address}</p>
                        </div>
                        <button className={buttonClass("outline", "sm")} onClick={() => setEdit(o)}>Edit</button>
                      </div>
                      <div className="mt-4 grid place-items-center rounded-lg bg-navy-50 py-6">
                        <div className="relative grid size-28 place-items-center rounded-full border-2 border-dashed border-accent-500 bg-accent-100/50">
                          <MapPin className="size-6 text-accent-700" />
                          <span className="absolute -bottom-6 text-xs font-medium text-accent-700">{o.radius} m radius</span>
                        </div>
                      </div>
                      <dl className="mt-8 grid grid-cols-3 gap-2 text-xs">
                        <div><dt className="text-ink-faint">Coordinates</dt><dd className="font-mono">{o.lat.toFixed(4)}, {o.lng.toFixed(4)}</dd></div>
                        <div><dt className="text-ink-faint">Hours</dt><dd>{o.start} – {o.end}</dd></div>
                        <div><dt className="text-ink-faint">Late after</dt><dd>{o.grace} min grace</dd></div>
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
              <Card className="max-w-2xl">
                <form action={() => show("Company details saved")} className="space-y-4">
                  <Field label="Company name"><input defaultValue="Crescent Bank" className={inputClass} /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Currency"><select className={inputClass} defaultValue="PKR"><option>PKR</option><option>USD</option><option>AED</option></select></Field>
                    <Field label="Time zone"><select className={inputClass}><option>Asia/Karachi (UTC+5)</option></select></Field>
                    <Field label="Working days"><input defaultValue="Monday to Friday" className={inputClass} /></Field>
                    <Field label="Session timeout (minutes)"><input type="number" min={5} max={120} defaultValue={30} className={inputClass} /></Field>
                  </div>
                  <div className="flex justify-end"><button className={buttonClass("primary")}>Save</button></div>
                </form>
              </Card>
            ),
          },
        ]}
      />
      <Modal open={edit !== null} onClose={() => setEdit(null)} title={edit === "new" ? "Add office" : "Edit office"} wide>
        <OfficeForm
          office={edit && edit !== "new" ? edit : undefined}
          onSave={(o) => {
            setOffices((l) => (l.some((x) => x.id === o.id) ? l.map((x) => (x.id === o.id ? o : x)) : [...l, o]));
            setEdit(null);
            show(`${o.name} saved. Attendance now checks a ${o.radius} m radius.`);
          }}
        />
      </Modal>
      {toast}
    </>
  );
}
