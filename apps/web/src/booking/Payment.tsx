import { useEffect, useRef, useState } from "react";
import { BookingExpiredError, formatDuration, formatPrice, servicesById, type BookingConfirmation, type Catalog } from "@salon/booking";
import { stripeFor, type StripeElements, type StripeInstance } from "./stripe";
import { Notice, Spinner, formatLongDate } from "./ui";

/** How long to wait for the payment to confirm the booking before saying it's still on its way. */
const CONFIRM_TIMEOUT_MS = 30_000;
const POLL_MS = 1_500;

const button =
  "mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold disabled:opacity-60";

/**
 * Deposit step shown when a booking comes back pending payment: Stripe's card form for real payments, or a
 * simulated payment in test mode. The booking is confirmed by the payment itself (the server hears from
 * Stripe), so after paying we wait for it.
 */
export default function Payment({
  booking,
  catalog,
  onPay,
  getStatus,
  onPaid,
  onExpired,
}: {
  booking: BookingConfirmation;
  catalog: Catalog;
  /** Test mode: completes the deposit without taking money. */
  onPay: (b: BookingConfirmation) => Promise<BookingConfirmation>;
  /** The booking as it stands now, while the payment confirms it. */
  getStatus?: (b: BookingConfirmation) => Promise<BookingConfirmation>;
  onPaid: (b: BookingConfirmation) => void;
  onExpired: (message: string) => void;
}) {
  const minutesLeft = useMinutesLeft(booking.expiresAt);
  const deposit = booking.deposit!;
  const stylist = catalog.stylists.find((s) => s.id === booking.stylistId);
  const stripe = booking.payment?.kind === "stripe" ? booking.payment : undefined;
  // Once the card has been charged, the hold running out no longer means "nothing was taken".
  const [submitted, setSubmitted] = useState(false);
  const expired = minutesLeft === 0 && !submitted;

  return (
    <div className="mx-auto max-w-lg py-6">
      <h1 className="font-serif text-3xl">Pay your deposit</h1>
      <p className="mt-3 text-muted">
        A deposit secures your appointment.
        {minutesLeft !== null && minutesLeft > 0 && ` We're holding it for you for ${minutesLeft} more minute${minutesLeft === 1 ? "" : "s"}.`}
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

      {expired ? (
        <div className="mt-6 space-y-4">
          <Notice tone="error">The time we held for you has run out, so no deposit has been taken.</Notice>
          <button type="button" className={button} onClick={() => onExpired("The time we held for you has run out. Please choose a time again.")}>
            Choose a time again
          </button>
        </div>
      ) : stripe && getStatus ? (
        <StripeCard booking={booking} payment={stripe} getStatus={getStatus} onSubmitted={() => setSubmitted(true)} onPaid={onPaid} onExpired={onExpired} />
      ) : (
        <SimulatedPay booking={booking} onPay={onPay} onPaid={onPaid} onExpired={onExpired} />
      )}
    </div>
  );
}

function SimulatedPay({
  booking,
  onPay,
  onPaid,
  onExpired,
}: {
  booking: BookingConfirmation;
  onPay: (b: BookingConfirmation) => Promise<BookingConfirmation>;
  onPaid: (b: BookingConfirmation) => void;
  onExpired: (message: string) => void;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <>
      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <button type="button" onClick={pay} disabled={paying} className={button}>
        {paying && <Spinner />}
        Pay {formatPrice(booking.deposit!.now)} deposit (simulated)
      </button>
      <p className="mt-3 text-center text-xs text-muted">Test mode: no card is needed and no money is taken.</p>
    </>
  );
}

type CardState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready" }
  | { kind: "paying" }
  | { kind: "confirming" }
  | { kind: "slow" };

/** Stripe's Payment Element (cards, Apple Pay, Google Pay), then waiting for the booking to be confirmed. */
function StripeCard({
  booking,
  payment,
  getStatus,
  onSubmitted,
  onPaid,
  onExpired,
}: {
  booking: BookingConfirmation;
  payment: { clientSecret: string; publishableKey: string; accountRef?: string };
  getStatus: (b: BookingConfirmation) => Promise<BookingConfirmation>;
  /** The card has been charged: from here the booking is confirmed by the payment. */
  onSubmitted: () => void;
  onPaid: (b: BookingConfirmation) => void;
  onExpired: (message: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripe = useRef<{ instance: StripeInstance; elements: StripeElements } | null>(null);
  const [state, setState] = useState<CardState>({ kind: "loading" });
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTest = payment.publishableKey.startsWith("pk_test_");

  useEffect(() => {
    let cancelled = false;
    let element: ReturnType<StripeElements["create"]> | undefined;
    stripeFor(payment.publishableKey, payment.accountRef).then(
      (instance) => {
        if (cancelled || !mountRef.current) return;
        const elements = instance.elements({
          clientSecret: payment.clientSecret,
          fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" }],
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#1c1917", colorText: "#1c1917", colorTextSecondary: "#6b6560", fontFamily: "Inter, system-ui, sans-serif", borderRadius: "12px" },
          },
        });
        element = elements.create("payment", { layout: "tabs" });
        element.on("ready", () => !cancelled && setState({ kind: "ready" }));
        element.on("change", (e) => setComplete(Boolean(e.complete)));
        element.mount(mountRef.current);
        stripe.current = { instance, elements };
      },
      () => !cancelled && setState({ kind: "unavailable" }),
    );
    return () => {
      cancelled = true;
      element?.destroy();
    };
  }, [payment.clientSecret, payment.publishableKey, payment.accountRef]);

  /** Polls until the payment has confirmed the booking (or the wait is too long). */
  const waitForConfirmation = async () => {
    setState({ kind: "confirming" });
    const until = Date.now() + CONFIRM_TIMEOUT_MS;
    while (Date.now() < until) {
      try {
        const now = await getStatus(booking);
        if (now.status === "confirmed") return onPaid(now);
      } catch (e) {
        if (e instanceof BookingExpiredError) return onExpired(e.message);
        // A blip: keep waiting.
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    setState({ kind: "slow" });
  };

  const pay = async () => {
    const s = stripe.current;
    if (!s) return;
    setError(null);
    setState({ kind: "paying" });
    const submitted = await s.elements.submit();
    if (submitted.error) {
      setError(submitted.error.message ?? "Please check your card details.");
      return setState({ kind: "ready" });
    }
    const result = await s.instance.confirmPayment({
      elements: s.elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });
    if (result.error) {
      // Card and validation errors are written for customers; anything else gets a general message.
      const forCustomer = result.error.type === "card_error" || result.error.type === "validation_error";
      setError(forCustomer && result.error.message ? result.error.message : "The payment didn't go through. Please try again.");
      return setState({ kind: "ready" });
    }
    onSubmitted();
    await waitForConfirmation();
  };

  if (state.kind === "unavailable") {
    return (
      <div className="mt-6">
        <Notice tone="error">We couldn't load the card form. Please check your connection and refresh, or call us to book.</Notice>
      </div>
    );
  }
  if (state.kind === "confirming" || state.kind === "slow") {
    return (
      <div className="mt-8 space-y-3 text-center">
        {state.kind === "confirming" ? (
          <p className="flex items-center justify-center gap-2 text-muted">
            <Spinner /> Payment received. Confirming your booking…
          </p>
        ) : (
          <Notice>
            Your payment has gone through and we're still confirming your booking ({booking.reference}). You'll get a confirmation email
            shortly, so there's no need to book again. If the booking can't be confirmed, your deposit is refunded automatically.
          </Notice>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 min-h-24">
        {state.kind === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> Loading the secure card form…
          </p>
        )}
        <div ref={mountRef} />
      </div>
      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <button type="button" onClick={pay} disabled={state.kind !== "ready" || !complete} className={button}>
        {state.kind === "paying" && <Spinner />}
        Pay {formatPrice(booking.deposit!.now)} deposit
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        {isTest ? "Test mode: use card 4242 4242 4242 4242, any future date and any CVC. " : ""}
        Payments are handled securely by Stripe. We never see your card details.
      </p>
    </>
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
