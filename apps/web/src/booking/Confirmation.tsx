import { formatDuration, formatPrice, servicesById, type BookingConfirmation, type Catalog } from "@salon/booking";
import { salon } from "../data/content";
import { Link } from "../router";
import { Avatar, Check, formatLongDate } from "./ui";

function downloadIcs(c: BookingConfirmation, catalog: Catalog) {
  const stamp = (date: string, time: string) => `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
  const services = servicesById(catalog, c.serviceIds).map((s) => s.name).join(", ");
  const stylist = catalog.stylists.find((s) => s.id === c.stylistId)?.name ?? "";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${salon.name}//Booking//EN`,
    "BEGIN:VEVENT",
    `UID:${c.reference}@ngcanarywharf`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=Europe/London:${stamp(c.date, c.time)}`,
    `DTEND;TZID=Europe/London:${stamp(c.date, c.endTime)}`,
    `SUMMARY:${catalog.salonName}: ${services}`,
    `DESCRIPTION:With ${stylist}. Ref ${c.reference}`,
    `LOCATION:${salon.address.join(", ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.reference}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Confirmation({
  confirmation: c,
  catalog,
  email,
  onBookAnother,
}: {
  confirmation: BookingConfirmation;
  catalog: Catalog;
  email: string;
  onBookAnother: () => void;
}) {
  const index = catalog.stylists.findIndex((s) => s.id === c.stylistId);
  const stylist = catalog.stylists[index];
  const services = servicesById(catalog, c.serviceIds);

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
        <Check size={30} />
      </div>
      <h1 className="mt-6 font-serif text-3xl">Booking confirmed</h1>
      <p className="mt-3 text-muted">
        A confirmation will be sent to <span className="text-ink">{email}</span>.
      </p>
      <p className="mt-1 text-sm text-muted">
        Reference <span className="font-medium text-ink">{c.reference}</span>
      </p>

      <div className="mt-8 rounded-2xl border border-line p-6 text-left">
        <p className="font-medium">{formatLongDate(c.date)}</p>
        <p className="text-sm text-muted">
          {c.time} – {c.endTime} ({formatDuration(c.durationMin)})
        </p>
        <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
          <Avatar stylist={stylist} index={index} size="sm" />
          <p className="text-sm">
            with <span className="font-medium">{stylist?.name}</span>
            <span className="text-muted"> · {stylist?.role}</span>
          </p>
        </div>
        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {services.map((s) => (
            <li key={s.id} className="flex justify-between">
              <span>{s.name}</span>
              <span>{formatPrice(s.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-medium">
          <span>Total</span>
          <span>{formatPrice(c.total)}</span>
        </div>
        {c.deposit && (
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <span>{c.deposit.paid ? "Deposit paid" : "Deposit due"}</span>
              <span>{formatPrice(c.deposit.now)}</span>
            </div>
            <div className="flex justify-between">
              <span>To pay in the salon</span>
              <span>{formatPrice(c.deposit.atSalon)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => downloadIcs(c, catalog)}
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold"
        >
          Add to calendar
        </button>
        <button
          type="button"
          onClick={onBookAnother}
          className="rounded-full border border-ink/20 px-6 py-3 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
        >
          Book another
        </button>
        <Link to="/" className="rounded-full px-6 py-3 text-sm font-medium text-muted transition-colors hover:text-gold">
          Back to home
        </Link>
      </div>
    </div>
  );
}
