import { addDays } from "./dates";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** All-day calendar event as an .ics file for the user to review and save. */
export function buildIcs(opts: { id: string; title: string; date: string; note?: string }): string {
  const d = opts.date.replace(/-/g, "");
  const end = addDays(opts.date, 1).replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pocket Lists//EN",
    "BEGIN:VEVENT",
    `UID:${opts.id}@pocket-lists`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(opts.title)}`,
    ...(opts.note ? [`DESCRIPTION:${esc(opts.note)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
