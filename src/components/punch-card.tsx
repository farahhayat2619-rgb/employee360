"use client";

import clsx from "clsx";
import { Clock, Loader2, LogIn, LogOut, MapPin, MapPinOff } from "lucide-react";
import { useEffect, useState } from "react";
import { offices } from "@/lib/sample-data";
import { buttonClass } from "./ui";

type State =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "in"; at: Date; office: string; distance: number; accuracy: number }
  | { kind: "out"; inAt: Date; at: Date; office: string }
  | { kind: "outside"; distance: number; office: string }
  | { kind: "error"; message: string };

const MAX_ACCURACY_M = 100;

// Haversine distance in metres. Phase 3 runs this check on the server before saving.
function distanceMetres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function PunchCard() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  function check(onInside: (office: string, distance: number, accuracy: number) => void) {
    if (!("geolocation" in navigator)) {
      setState({ kind: "error", message: "This browser cannot share your location. Use a phone or a browser with location support." });
      return;
    }
    setState({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const accuracy = Math.round(pos.coords.accuracy);
        if (accuracy > MAX_ACCURACY_M) {
          setState({ kind: "error", message: `Your location is too imprecise (about ${accuracy} m). Turn on precise location and try again near a window.` });
          return;
        }
        const nearest = offices.map((o) => ({ o, d: Math.round(distanceMetres(here, o)) })).sort((a, b) => a.d - b.d)[0];
        if (nearest.d > nearest.o.radius) {
          setState({ kind: "outside", distance: nearest.d, office: nearest.o.name });
          return;
        }
        onInside(nearest.o.name, nearest.d, accuracy);
      },
      (err) => {
        setState({
          kind: "error",
          message: err.code === err.PERMISSION_DENIED ? "Location access is blocked. Allow location for Employee360 in your browser settings, then try again." : "We couldn't read your location. Check that location is on and try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  const punchedIn = state.kind === "in";
  const busy = state.kind === "locating";

  return (
    <div className="animate-rise rounded-xl bg-navy-900 p-5 text-white shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-navy-100/60 uppercase">Today</p>
          <p className="mt-1 text-lg font-semibold">{now ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : " "}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-100/70">
            <Clock className="size-3.5" /> Office hours 09:00 – 17:00 · {now ? time(now) : ""}
          </p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
            punchedIn ? "bg-good/25 text-green-200" : state.kind === "out" ? "bg-white/10 text-navy-100" : "bg-warn/30 text-amber-100",
          )}
        >
          {punchedIn ? "Punched in" : state.kind === "out" ? "Day complete" : "Not punched in"}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          disabled={busy || state.kind === "out"}
          onClick={() =>
            punchedIn
              ? check((office) => setState({ kind: "out", inAt: state.at, at: new Date(), office }))
              : check((office, distance, accuracy) => setState({ kind: "in", at: new Date(), office, distance, accuracy }))
          }
          className={clsx(buttonClass(punchedIn ? "outline" : "accent"), "py-3 text-base sm:min-w-44", punchedIn && "border-white/30 bg-transparent text-white hover:bg-white/10")}
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : punchedIn ? <LogOut className="size-5" /> : <LogIn className="size-5" />}
          {busy ? "Checking location…" : punchedIn ? "Punch Out" : "Punch In"}
        </button>
        <div className="text-sm text-navy-100/80" aria-live="polite">
          {state.kind === "idle" && "Tap Punch In when you are inside the office. We check your GPS location."}
          {state.kind === "locating" && "Reading your device's GPS location…"}
          {state.kind === "in" && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-green-300" /> In at {time(state.at)} · {state.office} · {state.distance} m from office (±{state.accuracy} m)
            </span>
          )}
          {state.kind === "out" && (
            <span>
              In {time(state.inAt)} · Out {time(state.at)} · {state.office}
            </span>
          )}
        </div>
      </div>

      {state.kind === "outside" && (
        <div className="mt-4 flex gap-2 rounded-lg bg-bad/25 p-3 text-sm text-red-100" role="alert">
          <MapPinOff className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">You&apos;re outside the authorized office location. Attendance cannot be marked.</p>
            <p className="mt-0.5 text-red-100/80">
              You are about {state.distance.toLocaleString()} m from {state.office}.
            </p>
          </div>
        </div>
      )}
      {state.kind === "error" && (
        <p className="mt-4 rounded-lg bg-warn/25 p-3 text-sm text-amber-100" role="alert">
          {state.message}
        </p>
      )}
      <p className="mt-4 text-[11px] text-navy-100/50">Preview: your real GPS location is checked against the office radius, but the punch is not saved until Phase 3.</p>
    </div>
  );
}
