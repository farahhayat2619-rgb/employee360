// Date and time helpers. Both offices are in Pakistan, so the working day is counted in Asia/Karachi
// no matter where the server runs.
export const APP_TZ = "Asia/Karachi";

const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "YYYY-MM-DD" for the office-local calendar day of an instant. */
export const localDate = (d: Date) => dateFmt.format(d);
/** "HH:MM" office-local time. */
export const localTime = (d: Date) => timeFmt.format(d);
export const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Postgres DATE columns come back as UTC midnight. */
export const dbDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const isoOf = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, n: number) {
  const d = dbDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoOf(d);
}

export const isWeekend = (iso: string) => {
  const dow = dbDate(iso).getUTCDay();
  return dow === 0 || dow === 6;
};

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Monday to Friday, minus public holidays. */
export const workingDays = (from: string, to: string, holidays: Set<string>) => eachDay(from, to).filter((d) => !isWeekend(d) && !holidays.has(d));

export const monthStart = (ym: string) => `${ym}-01`;
export function monthEnd(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return isoOf(new Date(Date.UTC(y, m, 0)));
}
export function shiftMonth(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return isoOf(d).slice(0, 7);
}
export const monthLabel = (ym: string) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
