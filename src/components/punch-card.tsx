"use client";

import clsx from "clsx";
import { CheckCircle2, Clock, Loader2, LogIn, LogOut, MapPin, MapPinOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { punch } from "@/app/actions/attendance";
import type { OfficeInfo, PunchResult, TodayPunch } from "@/lib/types";
import { buttonClass } from "./ui";

type Notice = { kind: "locating" } | { kind: "saving" } | { kind: "result"; result: PunchResult } | { kind: "error"; message: string } | null;

const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });
const dateLine = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" });

export function PunchCard({ today, office }: { today: TodayPunch; office: OfficeInfo }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const punchedIn = !!today.in && !today.out;
  const done = !!today.out;
  const busy = notice?.kind === "locating" || notice?.kind === "saving";
  const kind = punchedIn ? "out" : "in";

  function go() {
    if (!("geolocation" in navigator)) {
      setNotice({ kind: "error", message: "This browser cannot share your location. Use a phone or a browser with location support." });
      return;
    }
    setNotice({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNotice({ kind: "saving" });
        startTransition(async () => {
          try {
            const result = await punch(kind, { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
            setNotice({ kind: "result", result });
            if (result.ok) router.refresh();
          } catch {
            setNotice({ kind: "error", message: "We couldn't reach the server. Check your connection and try again." });
          }
        });
      },
      (err) =>
        setNotice({
          kind: "error",
          message: err.code === err.PERMISSION_DENIED ? "Location access is blocked. Allow location for Employee360 in your browser settings, then try again." : "We couldn't read your location. Check that location is on and try again.",
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  const result = notice?.kind === "result" ? notice.result : null;

  return (
    <div className="animate-rise rounded-xl bg-navy-900 p-5 text-white shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-navy-100/60 uppercase">Today</p>
          <p className="mt-1 text-lg font-semibold">{now ? dateLine(now) : " "}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-100/70">
            <Clock className="size-3.5" /> {office.name} · {office.workStart} – {office.workEnd}
            {now && ` · ${clock(now)}`}
          </p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
            punchedIn ? "bg-good/25 text-green-200" : done ? "bg-white/10 text-navy-100" : today.onLeave ? "bg-accent-500/30 text-blue-100" : "bg-warn/30 text-amber-100",
          )}
        >
          {punchedIn ? "Punched in" : done ? "Day complete" : today.onLeave ? "On leave" : "Not punched in"}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          disabled={busy || done || today.onLeave}
          onClick={go}
          className={clsx(buttonClass(punchedIn ? "outline" : "accent"), "py-3 text-base sm:min-w-44", punchedIn && "border-white/30 bg-transparent text-white hover:bg-white/10")}
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : punchedIn ? <LogOut className="size-5" /> : <LogIn className="size-5" />}
          {notice?.kind === "locating" ? "Reading GPS…" : notice?.kind === "saving" ? "Verifying…" : punchedIn ? "Punch Out" : "Punch In"}
        </button>
        <div className="text-sm text-navy-100/80" aria-live="polite">
          {!today.in && !busy && !today.onLeave && `Tap Punch In when you're inside the office. Your GPS location must be within ${office.radiusM} m.`}
          {today.onLeave && !today.in && "You're on approved leave today."}
          {notice?.kind === "locating" && "Reading your device's GPS location…"}
          {notice?.kind === "saving" && "Checking your distance from the office…"}
          {today.in && !busy && (
            <span className="flex flex-wrap items-center gap-x-1.5">
              <MapPin className="size-4 text-green-300" /> In {today.in}
              {today.out && ` · Out ${today.out}`} · {today.office}
              {today.inDist !== null && ` · ${today.inDist} m from office`}
              {today.inAcc !== null && ` (±${today.inAcc} m)`}
            </span>
          )}
        </div>
      </div>

      {result && !result.ok && result.reason === "outside" && (
        <div className="mt-4 flex gap-2 rounded-lg bg-bad/25 p-3 text-sm text-red-100" role="alert">
          <MapPinOff className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">{result.message}</p>
            {result.distance !== undefined && (
              <p className="mt-0.5 text-red-100/80">
                You are about {result.distance.toLocaleString()} m from {result.office}. You need to be within {office.radiusM} m.
              </p>
            )}
          </div>
        </div>
      )}
      {result && !result.ok && result.reason !== "outside" && (
        <p className="mt-4 rounded-lg bg-warn/25 p-3 text-sm text-amber-100" role="alert">
          {result.message}
        </p>
      )}
      {result?.ok && (
        <p className="mt-4 flex gap-2 rounded-lg bg-good/20 p-3 text-sm text-green-100" role="status">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {result.message}
        </p>
      )}
      {notice?.kind === "error" && (
        <p className="mt-4 rounded-lg bg-warn/25 p-3 text-sm text-amber-100" role="alert">
          {notice.message}
        </p>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-navy-100/50">
        <ShieldCheck className="size-3.5" /> Your location is checked on the server against the office radius each time you punch. The time comes from the server, not your phone.
      </p>
    </div>
  );
}
