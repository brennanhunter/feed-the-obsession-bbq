import { business } from "./business";

const TZ = "America/New_York";
const PREP_MIN = 20; // earliest ASAP/first slot lead time
const SLOT_MIN = 30; // pickup slot granularity

const toMins = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

const fmt12 = (h: number, m: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${ampm}` : `${h12} ${ampm}`;
};

const partsInTZ = (date: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour12: false, ...opts })
    .formatToParts(date)
    .reduce<Record<string, string>>((a, p) => ((a[p.type] = p.value), a), {});

/** Current wall-clock in the shop's timezone. */
function nowET() {
  const p = partsInTZ(new Date(), {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(p.minute, 10);
  return { weekday: p.weekday, year: +p.year, month: +p.month, day: +p.day, mins: hour * 60 + minute };
}

/** Offset (ms) of ET vs UTC at a given instant — handles DST. */
function etOffsetMs(date: Date) {
  const p = partsInTZ(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let hh = parseInt(p.hour, 10);
  if (hh === 24) hh = 0;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, hh, +p.minute, +p.second);
  return asUTC - date.getTime();
}

/** An ET wall-clock (Y/M/D H:M) → the correct absolute Date. */
function etToDate(y: number, mo: number, d: number, h: number, mi: number) {
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return new Date(guess.getTime() - etOffsetMs(guess));
}

export function getOpenStatus(): { open: boolean; label: string } {
  const now = nowET();
  const today = business.hours.find((h) => h.days.includes(now.weekday));
  if (!today) return { open: false, label: "Closed today" };
  const openM = toMins(today.opens);
  const closeM = toMins(today.closes);
  const [ch, cm] = today.closes.split(":").map(Number);
  const [oh, om] = today.opens.split(":").map(Number);
  if (now.mins >= openM && now.mins < closeM)
    return { open: true, label: `Open now · closes ${fmt12(ch, cm)}` };
  return { open: false, label: `Closed · opens ${fmt12(oh, om)}` };
}

export type PickupOption = { iso: string; label: string };

/** ASAP availability + upcoming scheduled pickup slots (in the shop's tz). */
export function getPickupOptions(): { asap: boolean; slots: PickupOption[] } {
  const now = nowET();
  const today = business.hours.find((h) => h.days.includes(now.weekday));
  const asap = today ? now.mins >= toMins(today.opens) && now.mins < toMins(today.closes) : false;

  const slots: PickupOption[] = [];
  const noonToday = etToDate(now.year, now.month, now.day, 12, 0);

  for (let offset = 0; offset < 4 && slots.length < 24; offset++) {
    const dayDate = new Date(noonToday.getTime() + offset * 86400000);
    const p = partsInTZ(dayDate, { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });
    const hrs = business.hours.find((h) => h.days.includes(p.weekday));
    if (!hrs) continue;

    const openM = toMins(hrs.opens);
    const closeM = toMins(hrs.closes);
    let startM = offset === 0 ? Math.max(openM, now.mins + PREP_MIN) : openM;
    startM = Math.ceil(startM / SLOT_MIN) * SLOT_MIN;

    for (let m = startM; m < closeM && slots.length < 24; m += SLOT_MIN) {
      const h = Math.floor(m / 60);
      const mi = m % 60;
      const iso = etToDate(+p.year, +p.month, +p.day, h, mi).toISOString();
      const dayLabel = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : p.weekday;
      slots.push({ iso, label: `${dayLabel} ${fmt12(h, mi)}` });
    }
  }
  return { asap, slots };
}

/** Human label for a scheduled pickup ISO, in the shop's timezone. */
export function formatPickupLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
