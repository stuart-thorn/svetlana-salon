// Everything the "Add to calendar" page needs to build its links. Ported from
// bootickets-cta (frontend/src/lib/ticketCalendar.ts).

import { servicesById, type BookingConfirmation, type Catalog } from "@salon/booking";
import { salon } from "../data/content";

/** What a calendar entry needs, whichever calendar it goes into. */
export type CalendarEntry = {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
};

/** Europe/London minus UTC, in ms, at the given instant. */
function londonOffsetAt(ms: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const n = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second")) - ms;
}

/** The instant a salon wall-clock time (YYYY-MM-DD, HH:MM) falls on. */
export function londonInstant(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y!, m! - 1, d!, h!, mi!);
  let t = wall - londonOffsetAt(wall);
  // Re-check once in case the guess crossed a clock change.
  const offset = londonOffsetAt(t);
  if (wall - offset !== t) t = wall - offset;
  return new Date(t);
}

export function calendarEntry(c: BookingConfirmation, catalog: Catalog): CalendarEntry {
  const services = servicesById(catalog, c.serviceIds).map((s) => s.name).join(", ");
  const stylist = [...new Set((c.people?.map((p) => p.stylistId) ?? [c.stylistId]).map((id) => catalog.stylists.find((s) => s.id === id)?.name).filter(Boolean))].join(" and ");
  return {
    uid: `${c.reference}@ngcanarywharf`,
    title: `${catalog.salonName}: ${services}`,
    description: [stylist && `With ${stylist}.`, `Booking reference ${c.reference}.`].filter(Boolean).join(" "),
    location: `${salon.name}, ${salon.address.join(", ")}`,
    start: londonInstant(c.date, c.time),
    end: londonInstant(c.date, c.endTime),
  };
}

/** UTC in the compact iCalendar form: YYYYMMDDTHHMMSSZ. */
export function formatUtcIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(entry: CalendarEntry): string {
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", entry.title);
  params.set("dates", `${formatUtcIcsDate(entry.start)}/${formatUtcIcsDate(entry.end)}`);
  params.set("details", entry.description);
  params.set("location", entry.location);
  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

/**
 * Outlook's compose deeplink. `personal` is Outlook.com (Hotmail, Live);
 * `work` is Microsoft 365, the same form on a different host.
 */
export function outlookCalendarUrl(entry: CalendarEntry, account: "personal" | "work"): string {
  const host = account === "work" ? "https://outlook.office.com" : "https://outlook.live.com";
  const params = new URLSearchParams();
  params.set("path", "/calendar/action/compose");
  params.set("rru", "addevent");
  params.set("subject", entry.title);
  params.set("startdt", entry.start.toISOString());
  params.set("enddt", entry.end.toISOString());
  params.set("body", entry.description);
  params.set("location", entry.location);
  return `${host}/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Escapes a TEXT value for iCalendar (RFC 5545 §3.3.11). */
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function icsFile(entry: CalendarEntry): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${salon.name}//Booking//EN`,
    "BEGIN:VEVENT",
    `UID:${entry.uid}`,
    `DTSTAMP:${formatUtcIcsDate(new Date())}`,
    `DTSTART:${formatUtcIcsDate(entry.start)}`,
    `DTEND:${formatUtcIcsDate(entry.end)}`,
    `SUMMARY:${icsText(entry.title)}`,
    `DESCRIPTION:${icsText(entry.description)}`,
    `LOCATION:${icsText(entry.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** A data: URL rather than a blob, so it still works as a plain link (and on iOS Safari, opens straight into Calendar). */
export function icsDataUrl(entry: CalendarEntry): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(entry))}`;
}
