import { formatDuration, formatPrice, servicesById, type BookingConfirmation, type Catalog, type Offer } from "@salon/booking";
import { Link, navigate, scrollToTop, useLocation } from "../router";
import CalendarChoice from "./CalendarChoice";
import { freeCancellationUntil } from "./policy";
import { Avatar, Check, formatLongDate } from "./ui";

export default function Confirmation({
  confirmation: c,
  catalog,
  email,
  offers = [],
  onBookAnother,
}: {
  confirmation: BookingConfirmation;
  catalog: Catalog;
  email: string;
  /** Offers the booking was made with, to remind them what to bring. */
  offers?: Offer[];
  onBookAnother: () => void;
}) {
  const index = catalog.stylists.findIndex((s) => s.id === c.stylistId);
  const stylist = catalog.stylists[index];
  const services = servicesById(catalog, c.serviceIds);
  const listTotal = services.reduce((sum, s) => sum + s.price, 0);
  const { pathname, search } = useLocation();

  if (search.get("view") === "calendar") {
    // Only reachable from the summary below (the confirmation lives in memory), so back is always the summary.
    return <CalendarChoice confirmation={c} catalog={catalog} onBack={() => window.history.back()} />;
  }

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
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
        {offers.length > 0 && listTotal > c.total && (
          <div className="mt-2 flex justify-between text-sm text-accent-dark">
            <span>{offers.map((o) => o.name).join(", ")}</span>
            <span>−{formatPrice(Math.round((listTotal - c.total) * 100) / 100)}</span>
          </div>
        )}
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
      {offers.map((o) => (
        <p key={o.id} className="mt-4 text-sm">
          <span className="font-medium">{o.name}:</span> {o.claim ? `${o.claim.check} at your appointment.` : "applied."}
        </p>
      ))}
      {catalog.cancellation && (
        <p className="mt-4 text-sm text-muted">
          Free cancellation or changes until {freeCancellationUntil(c.date, c.time, catalog.cancellation.windowHours)}. Use the link in your
          confirmation email.{" "}
          <Link to="/terms#cancelling" className="underline underline-offset-2 hover:text-ink">
            Booking terms
          </Link>
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => {
            navigate(`${pathname}?view=calendar`);
            scrollToTop();
          }}
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent"
        >
          Add to calendar
        </button>
        <button
          type="button"
          onClick={onBookAnother}
          className="rounded-full border border-ink/20 px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Book another
        </button>
        <Link to="/" className="rounded-full px-6 py-3 text-sm font-medium text-muted transition-colors hover:text-accent">
          Back to home
        </Link>
      </div>
    </div>
  );
}
