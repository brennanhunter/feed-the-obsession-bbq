import { business } from "./business";

const fmt = (h: number, m: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${ampm}` : `${h12} ${ampm}`;
};

/** Open/closed status computed in the shop's timezone (America/New_York). */
export function getOpenStatus(): { open: boolean; label: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

  const weekday = get("weekday");
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const nowMins = hour * 60 + parseInt(get("minute"), 10);

  const today = business.hours.find((h) => h.days.includes(weekday));
  if (!today) return { open: false, label: "Closed today" };

  const [oh, om] = today.opens.split(":").map(Number);
  const [ch, cm] = today.closes.split(":").map(Number);
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;

  if (nowMins >= openMins && nowMins < closeMins)
    return { open: true, label: `Open now · closes ${fmt(ch, cm)}` };
  return { open: false, label: `Closed · opens ${fmt(oh, om)}` };
}
