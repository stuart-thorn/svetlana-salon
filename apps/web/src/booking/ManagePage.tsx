import { useCallback, useEffect, useState } from "react";
import { SlotUnavailableError, type Catalog, type ManagedBooking } from "@salon/booking";
import { Link, useLocation } from "../router";
import { salon } from "../data/content";
import { useCustomer } from "./customer";
import { CustomerSignIn } from "./CustomerSignIn";
import { provider } from "./provider";
import DateStep from "./steps/DateStep";
import TimeStep from "./steps/TimeStep";
import { Notice, Spinner, formatLongDate } from "./ui";

const button =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white cta-hover disabled:opacity-60";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-60";
const heading = "text-xs font-medium tracking-[0.2em] text-muted uppercase";

const money = (n: number) => `£${n % 1 ? n.toFixed(2) : n}`;

/** An instant as the salon's day and time, e.g. "Tue 25 Nov, 10:00". */
const salonTime = (instant: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/London",
  })
    .format(new Date(instant))
    .replace(/,? (\d\d:\d\d)$/, ", $1");

type Mode =
  | { kind: "view" }
  | { kind: "cancel" }
  | { kind: "date" }
  | { kind: "time"; date: string }
  | { kind: "confirm"; date: string; time: string };

/**
 * /manage?ref=…&t=…: a customer's own booking, from the link in their email (or signed in, from My account).
 * They can cancel it (told first what they'd get back) and, before the cancellation window, pick a new time
 * with the same services and stylist.
 */
export default function ManagePage() {
  const { search } = useLocation();
  const reference = (search.get("ref") ?? "").trim();
  const token = search.get("t") ?? undefined;
  const { state, signedIn, signOut } = useCustomer();
  const signedInNow = state.status === "signed_in";
  const access = { reference, ...(token && { token }) };

  const [booking, setBooking] = useState<ManagedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>({ kind: "view" });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  const canOpen = !!reference && (!!token || signedInNow);
  const load = useCallback(async () => {
    if (!provider.getManagedBooking || !canOpen) return setLoading(false);
    setLoading(true);
    setError(null);
    try {
      setBooking(
        await provider.getManagedBooking({
          reference,
          ...(token && { token }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't load your booking.");
    } finally {
      setLoading(false);
    }
  }, [reference, token, canOpen]);
  useEffect(() => {
    void load();
  }, [load]);

  // The catalogue (stylists, for picking a new time) once they want to move it.
  useEffect(() => {
    if (mode.kind !== "view" && mode.kind !== "cancel" && !catalog) void provider.getCatalog().then(setCatalog, () => undefined);
  }, [mode.kind, catalog]);

  const run = async (work: () => Promise<ManagedBooking>, message: string) => {
    setBusy(true);
    setActionError(null);
    try {
      setBooking(await work());
      setDone(message);
      setMode({ kind: "view" });
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err instanceof SlotUnavailableError && mode.kind === "confirm") {
        setMode({ kind: "time", date: mode.date });
        setActionError("Sorry, that time has just been taken. Please choose another.");
      } else setActionError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-serif text-lg">
            {salon.name}
          </Link>
          <Link to={signedInNow ? "/account" : "/book"} className="text-sm text-muted hover:text-ink">
            {signedInNow ? "My account" : "Book an appointment"}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl">Your booking</h1>

        {!provider.getManagedBooking || !reference ? (
          <div className="mt-6">
            <Notice>Open the link in your booking email to change or cancel, or call us on {salon.phone}.</Notice>
          </div>
        ) : !canOpen ? (
          <div className="mt-6">
            <p className="mb-4 text-muted">Sign in with the email you booked with to see booking {reference}.</p>
            <CustomerSignIn state={state} onSignedIn={signedIn} onSignOut={signOut} startOpen />
          </div>
        ) : loading ? (
          <p className="mt-6 flex items-center gap-2 text-muted">
            <Spinner /> Loading…
          </p>
        ) : error || !booking ? (
          <div className="mt-6">
            <Notice tone="error">
              {error ?? "We couldn't find that booking."} If you need help, call us on {salon.phone}.
            </Notice>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {done && <Notice>{done}</Notice>}
            <Summary booking={booking} />

            {mode.kind === "view" && (
              <Actions
                booking={booking}
                onCancel={() => (setDone(null), setMode({ kind: "cancel" }))}
                onMove={() => (setDone(null), setMode({ kind: "date" }))}
              />
            )}

            {mode.kind === "cancel" && (
              <section className="space-y-4 rounded-2xl border border-line p-5">
                <p className="font-medium">
                  Cancel your appointment on {formatLongDate(booking.date)} at {booking.time}?
                </p>
                <p className="text-sm text-muted">{cancelOutcome(booking)}</p>
                {actionError && <Notice tone="error">{actionError}</Notice>}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={button}
                    disabled={busy}
                    onClick={() =>
                      run(() => provider.cancelManagedBooking!(access), "Your booking is cancelled. We've sent you an email to confirm.")
                    }
                  >
                    {busy && <Spinner />} Yes, cancel it
                  </button>
                  <button type="button" className={secondary} disabled={busy} onClick={() => setMode({ kind: "view" })}>
                    Keep my booking
                  </button>
                </div>
              </section>
            )}

            {mode.kind === "date" && (
              <section className="space-y-4">
                <h2 className={heading}>Choose a new day</h2>
                <DateStep
                  stylistId={booking.services[0]!.stylistId}
                  serviceIds={[...new Set(booking.services.map((s) => s.serviceId))]}
                  selected={null}
                  onSelect={(date) => setMode({ kind: "time", date })}
                />
                <button type="button" className={secondary} onClick={() => setMode({ kind: "view" })}>
                  Keep my booking
                </button>
              </section>
            )}

            {mode.kind === "time" &&
              (!catalog ? (
                <p className="flex items-center gap-2 text-muted">
                  <Spinner /> Loading…
                </p>
              ) : (
                <section className="space-y-4">
                  <h2 className={heading}>Choose a new time</h2>
                  <TimeStep
                    catalog={catalog}
                    stylist={booking.services[0]!.stylistId}
                    serviceIds={[...new Set(booking.services.map((s) => s.serviceId))]}
                    date={mode.date}
                    selected={null}
                    error={actionError}
                    fixedStylist
                    onStylistChange={() => undefined}
                    onDateChange={(date) => setMode({ kind: "time", date })}
                    onChangeDateClick={() => setMode({ kind: "date" })}
                    onSelect={(time) => {
                      setActionError(null);
                      setMode({ kind: "confirm", date: mode.date, time });
                    }}
                  />
                  <button type="button" className={secondary} onClick={() => setMode({ kind: "view" })}>
                    Keep my booking
                  </button>
                </section>
              ))}

            {mode.kind === "confirm" && (
              <section className="space-y-4 rounded-2xl border border-line p-5">
                <p className="font-medium">
                  Move your appointment to {formatLongDate(mode.date)} at {mode.time}?
                </p>
                <p className="text-sm text-muted">
                  Same services
                  {booking.services[0]?.stylistName ? ` with ${booking.services[0].stylistName}` : ""}. Anything you've paid moves with it.
                </p>
                {actionError && <Notice tone="error">{actionError}</Notice>}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={button}
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          provider.rescheduleManagedBooking!(access, {
                            date: mode.date,
                            time: mode.time,
                          }),
                        "Your booking has moved. We've emailed you the new details.",
                      )
                    }
                  >
                    {busy && <Spinner />} Confirm new time
                  </button>
                  <button type="button" className={secondary} disabled={busy} onClick={() => setMode({ kind: "time", date: mode.date })}>
                    Choose another time
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Summary({ booking }: { booking: ManagedBooking }) {
  const stylists = [...new Set(booking.services.map((s) => s.stylistName).filter(Boolean))];
  return (
    <section className="rounded-2xl border border-line p-5">
      <p className="text-xs text-muted">Reference {booking.reference}</p>
      <p className="mt-2 font-medium">
        {formatLongDate(booking.date)}, {booking.time}–{booking.end}
      </p>
      {booking.services.some((s) => s.person) ? (
        // A group: each person, their services and professional.
        <ul className="mt-2 space-y-1 text-sm">
          {[...new Set(booking.services.map((s) => s.person ?? ""))].map((person) => {
            const mine = booking.services.filter((s) => (s.person ?? "") === person);
            const with_ = [...new Set(mine.map((s) => s.stylistName).filter(Boolean))];
            return (
              <li key={person}>
                <span className="font-medium">{person}:</span> {mine.map((s) => s.name).join(", ")}
                <span className="text-muted">
                  {mine[0]?.time ? `, ${mine[0].time}` : ""}
                  {with_.length > 0 && ` with ${with_.join(" and ")}`}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-1 text-sm">
          {booking.services.map((s) => s.name).join(", ")}
          {stylists.length > 0 && <span className="text-muted"> with {stylists.join(" and ")}</span>}
        </p>
      )}
      {(booking.total > 0 || booking.services.some((s) => s.priceToAgree)) && (
        <p className="mt-3 text-sm text-muted">
          {money(booking.total)}
          {booking.paid > 0 ? `, ${money(booking.paid)} paid` : ""}
          {booking.services.some((s) => s.priceToAgree) &&
            ` · the price of ${[...new Set(booking.services.filter((s) => s.priceToAgree).map((s) => s.name))].join(" and ")} is agreed in the salon, and what you've paid counts towards it`}
        </p>
      )}
      {booking.status === "cancelled" && booking.cancelled && (
        <p className="mt-3 text-sm">
          <span className="font-medium">Cancelled.</span>{" "}
          {booking.cancelled.refund > 0 &&
            `${money(booking.cancelled.refund)} is being refunded to your card (it can take 5 to 10 working days). `}
          {booking.cancelled.kept > 0 && `The ${money(booking.cancelled.kept)} paid isn't refunded.`}
        </p>
      )}
      {(booking.status === "completed" || booking.status === "no_show") && (
        <p className="mt-3 text-sm text-muted">This appointment has passed.</p>
      )}
    </section>
  );
}

function Actions({ booking, onCancel, onMove }: { booking: ManagedBooking; onCancel: () => void; onMove: () => void }) {
  const c = booking.cancellation;
  if (booking.status !== "confirmed" || !booking.canCancel) {
    return booking.status === "confirmed" ? (
      <p className="text-sm text-muted">Your appointment has started. Need anything? Call us on {salon.phone}.</p>
    ) : null;
  }
  return (
    <section className="space-y-4">
      {c && (
        <p className="text-sm text-muted">
          {c.late
            ? `It's less than ${c.windowHours} hours to your appointment.${c.kept > 0 ? ` If you cancel now, the ${money(c.kept)} paid isn't refunded.` : ""}${c.usesVisits ? " The membership visit isn't given back." : ""}`
            : booking.services.some((s) => s.person)
              ? `Free cancellation until ${salonTime(c.deadline)}.`
              : `Free cancellation and changes until ${salonTime(c.deadline)}.`}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {booking.canReschedule && (
          <button type="button" className={button} onClick={onMove}>
            Change time
          </button>
        )}
        <button type="button" className={booking.canReschedule ? secondary : button} onClick={onCancel}>
          Cancel booking
        </button>
      </div>
      {!booking.canReschedule && (
        <p className="text-sm text-muted">
          To change the time, please call us on{" "}
          <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="underline underline-offset-2 hover:text-ink">
            {salon.phone}
          </a>
          .
        </p>
      )}
    </section>
  );
}

/** What cancelling now does with money and membership visits, in a sentence. */
function cancelOutcome(b: ManagedBooking): string {
  const c = b.cancellation;
  if (!c) return "";
  const parts = [
    c.refund > 0 ? `${money(c.refund)} will be refunded to your card.` : "",
    c.kept > 0 ? `As it's less than ${c.windowHours} hours away, the ${money(c.kept)} paid isn't refunded.` : "",
    c.usesVisits ? (c.visitsReturned ? "Your membership visit is given back." : "Your membership visit isn't given back.") : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "Nothing has been paid, so there's nothing to refund.";
}
