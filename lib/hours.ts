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

/** Calendar parts of a moment in the shop's timezone (for day-based menu rules). */
export function getETDateParts(date: Date = new Date()) {
  const p = partsInTZ(date, { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });
  return { weekday: p.weekday, year: +p.year, month: +p.month, day: +p.day };
}

const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Opening hours for a calendar day, or undefined if the shop is closed that day. */
function hoursOn(weekday: string, y: number, m: number, d: number) {
  if (business.closedDates.includes(ymd(y, m, d))) return undefined;
  return business.hours.find((h) => h.days.includes(weekday));
}

/** True if the shop is open (by the posted hours and holiday closures) at `date`. */
export function isOpenAt(date: Date): boolean {
  const p = partsInTZ(date, { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const hrs = hoursOn(p.weekday, +p.year, +p.month, +p.day);
  if (!hrs) return false;
  const mins = (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10);
  return mins >= toMins(hrs.opens) && mins < toMins(hrs.closes);
}

export function getOpenStatus(): { open: boolean; label: string } {
  const now = nowET();
  const today = hoursOn(now.weekday, now.year, now.month, now.day);
  if (!today) return { open: false, label: "Closed today" };
  const openM = toMins(today.opens);
  const closeM = toMins(today.closes);
  const [ch, cm] = today.closes.split(":").map(Number);
  const [oh, om] = today.opens.split(":").map(Number);
  if (now.mins >= openM && now.mins < closeM)
    return { open: true, label: `Open now · closes ${fmt12(ch, cm)}` };
  return { open: false, label: `Closed · opens ${fmt12(oh, om)}` };
}

export type PickupOption = { iso: string; label: string; day: string; time: string }; // day: "Today" / "Tomorrow" / "Sun 11/22"

/** Whole calendar days (shop's tz) from today to the given moment: 0 = today. */
export function etDaysAhead(date: Date): number {
  const a = getETDateParts(new Date());
  const b = getETDateParts(date);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);
}

/**
 * ASAP availability + upcoming scheduled pickup slots (in the shop's tz).
 * `leadDays` > 0 (whole cuts in the cart) drops ASAP and starts the slots that
 * many calendar days out, so a 2-day item can't be picked up sooner.
 */
export function getPickupOptions(leadDays = 0): { asap: boolean; slots: PickupOption[] } {
  const now = nowET();
  const today = hoursOn(now.weekday, now.year, now.month, now.day);
  const asap = leadDays > 0 ? false : today ? now.mins >= toMins(today.opens) && now.mins < toMins(today.closes) : false;
  const maxSlots = 64; // up to four days to choose from

  const slots: PickupOption[] = [];
  const noonToday = etToDate(now.year, now.month, now.day, 12, 0);

  for (let offset = leadDays; offset < leadDays + 4 && slots.length < maxSlots; offset++) {
    const dayDate = new Date(noonToday.getTime() + offset * 86400000);
    const p = partsInTZ(dayDate, { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });
    const hrs = hoursOn(p.weekday, +p.year, +p.month, +p.day);
    if (!hrs) continue;

    const openM = toMins(hrs.opens);
    const closeM = toMins(hrs.closes);
    let startM = offset === 0 ? Math.max(openM, now.mins + PREP_MIN) : openM;
    startM = Math.ceil(startM / SLOT_MIN) * SLOT_MIN;

    for (let m = startM; m < closeM && slots.length < maxSlots; m += SLOT_MIN) {
      const h = Math.floor(m / 60);
      const mi = m % 60;
      const iso = etToDate(+p.year, +p.month, +p.day, h, mi).toISOString();
      const dayLabel =
        offset === 0
          ? "Today"
          : offset === 1
            ? "Tomorrow"
            : `${p.weekday.slice(0, 3)} ${+p.month}/${+p.day}`;
      slots.push({ iso, label: `${dayLabel} ${fmt12(h, mi)}`, day: dayLabel, time: fmt12(h, mi) });
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
