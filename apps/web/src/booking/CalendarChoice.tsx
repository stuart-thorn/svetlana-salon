// Where "Add to calendar" on the confirmation lands: one row per calendar.
// Replicates the bootickets-cta TicketCalendarPage.

import type { BookingConfirmation, Catalog } from "@salon/booking";
import calendarIconSrc from "../assets/calendar-icon.svg";
import googleCalendarIconSrc from "../assets/google-calendar.svg";
import { calendarEntry, googleCalendarUrl, icsDataUrl, outlookCalendarUrl } from "./calendar";
import { Chevron, formatLongDate } from "./ui";

export default function CalendarChoice({
  confirmation: c,
  catalog,
  onBack,
}: {
  confirmation: BookingConfirmation;
  catalog: Catalog;
  onBack: () => void;
}) {
  const entry = calendarEntry(c, catalog);
  const ics = icsDataUrl(entry);
  const download = `${c.reference}.ics`;
  const rows = [
    { name: "Apple Calendar", sub: "iPhone, iPad and Mac", href: ics, icon: calendarIconSrc, external: false },
    { name: "Google Calendar", sub: "Opens Google Calendar", href: googleCalendarUrl(entry), icon: googleCalendarIconSrc, external: true },
    { name: "Outlook.com", sub: "Personal Microsoft accounts", href: outlookCalendarUrl(entry, "personal"), icon: calendarIconSrc, external: true },
    { name: "Outlook (Microsoft 365)", sub: "Work or school accounts", href: outlookCalendarUrl(entry, "work"), icon: calendarIconSrc, external: true },
  ];

  return (
    <div className="mx-auto max-w-lg py-6">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted transition-colors hover:text-gold"
      >
        <Chevron dir="left" size={16} /> Back to your booking
      </button>
      <h1 className="mt-4 font-serif text-3xl">Add to your calendar</h1>
      <p className="mt-2 text-muted">
        {formatLongDate(c.date)}, {c.time} – {c.endTime}
      </p>

      <ul className="mt-6 overflow-hidden rounded-2xl border border-line">
        {rows.map((r, i) => (
          <li key={r.name} className={i === 0 ? "" : "border-t border-line"}>
            <a
              href={r.href}
              className="flex min-h-[60px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-stone-50"
              {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : { download })}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                <img src={r.icon} alt="" className="block h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-5">{r.name}</span>
                <span className="block text-xs leading-4 text-muted">{r.sub}</span>
              </span>
              <span aria-hidden className="text-muted">
                <Chevron size={18} />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-muted">
        Using another calendar app?{" "}
        <a href={ics} download={download} className="text-ink underline-offset-2 hover:text-gold hover:underline">
          Download the .ics file →
        </a>
      </p>
    </div>
  );
}
