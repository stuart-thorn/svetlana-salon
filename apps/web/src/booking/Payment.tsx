import { useEffect, useState } from "react";
import { BookingExpiredError, formatDuration, formatPrice, servicesById, type BookingConfirmation, type Catalog } from "@salon/booking";
import { Notice, Spinner, formatLongDate } from "./ui";

/** Deposit step shown when a booking comes back pending payment. Payment is simulated (test mode). */
export default function Payment({
  booking,
  catalog,
  onPay,
  onPaid,
  onExpired,
}: {
  booking: BookingConfirmation;
  catalog: Catalog;
  onPay: (b: BookingConfirmation) => Promise<BookingConfirmation>;
  onPaid: (b: BookingConfirmation) => void;
  onExpired: (message: string) => void;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minutesLeft = useMinutesLeft(booking.expiresAt);
  const deposit = booking.deposit!;
  const stylist = catalog.stylists.find((s) => s.id === booking.stylistId);

  const pay = async () => {
    setPaying(true);
    setError(null);
    try {
      onPaid(await onPay(booking));
    } catch (e) {
      if (e instanceof BookingExpiredError) onExpired(e.message);
      else setError("The payment didn't go through. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-6">
      <h1 className="font-serif text-3xl">Pay your deposit</h1>
      <p className="mt-3 text-muted">
        A deposit secures your appointment.
        {minutesLeft !== null && ` We're holding it for you for ${minutesLeft} more minute${minutesLeft === 1 ? "" : "s"}.`}
      </p>

      <div className="mt-8 rounded-2xl border border-line p-6">
        <p className="font-medium">{formatLongDate(booking.date)}</p>
        <p className="text-sm text-muted">
          {booking.time} – {booking.endTime} ({formatDuration(booking.durationMin)}) with {stylist?.name}
        </p>
        <ul className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          {servicesById(catalog, booking.serviceIds).map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Total</dt>
            <dd>{formatPrice(booking.total)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Deposit to pay now</dt>
            <dd>{formatPrice(deposit.now)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">To pay in the salon</dt>
            <dd>{formatPrice(deposit.atSalon)}</dd>
          </div>
        </dl>
      </div>

      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={paying}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold disabled:opacity-60"
      >
        {paying && <Spinner />}
        Pay {formatPrice(deposit.now)} deposit (simulated)
      </button>
      <p className="mt-3 text-center text-xs text-muted">Test mode: no card is needed and no money is taken.</p>
    </div>
  );
}

function useMinutesLeft(expiresAt?: string): number | null {
  const left = () => (expiresAt ? Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 60_000)) : null);
  const [minutes, setMinutes] = useState(left);
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setMinutes(left()), 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);
  return minutes;
}
