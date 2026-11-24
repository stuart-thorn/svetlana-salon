import { useState, type FormEvent } from "react";
import { CodeError, formatPrice, type Customer, type CustomerSession } from "@salon/booking";
import { customerAuth } from "../provider";
import { Link } from "../../router";
import { Spinner } from "../ui";

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

export const DETAILS_FORM_ID = "booking-details";

export function validateCustomer(c: Customer): CustomerErrors {
  const e: CustomerErrors = {};
  if (!c.name.trim()) e.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) e.email = "Please enter a valid email address.";
  if (c.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a valid phone number.";
  return e;
}

interface Props {
  value: Customer;
  errors: CustomerErrors;
  onChange: (value: Customer) => void;
  onSubmit: () => void;
  /** Amounts in pounds when part of the price is paid online. */
  deposit?: { now: number; atSalon: number };
  /** A signed-in customer books in the email they proved, so it can't be changed here. */
  signedInEmail?: string;
  /** Signed in and known: the booking is under their own name (changed on their account page, not here). */
  accountName?: string;
  /** Not signed in, where sign-in is offered: confirming the typed email here signs them in. */
  onSignedIn?: (s: CustomerSession) => void;
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none sm:text-sm transition-colors focus:border-gold aria-[invalid=true]:border-red-400 read-only:bg-stone-50 read-only:text-muted";

const FIELDS = [
  { key: "name", label: "Full name", type: "text", autoComplete: "name" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Mobile number", type: "tel", autoComplete: "tel" },
] as const;

export default function DetailsStep({ value, errors, onChange, onSubmit, deposit, signedInEmail, accountName, onSignedIn }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form id={DETAILS_FORM_ID} noValidate onSubmit={submit} className="max-w-lg space-y-5">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={`customer-${f.key}`} className="text-sm font-medium">
            {f.label}
          </label>
          <input
            id={`customer-${f.key}`}
            name={f.key}
            type={f.type}
            autoComplete={f.autoComplete}
            value={value[f.key]}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            readOnly={(f.key === "email" && !!signedInEmail) || (f.key === "name" && !!accountName)}
            aria-invalid={errors[f.key] ? true : undefined}
            aria-describedby={errors[f.key] ? `customer-${f.key}-error` : undefined}
            className={inputClass}
          />
          {f.key === "email" && signedInEmail && <p className="mt-1 text-xs text-muted">You're signed in with this email.</p>}
          {f.key === "name" && accountName && (
            <p className="mt-1 text-xs text-muted">
              Bookings are in the name on your account.{" "}
              <Link to="/account" className="underline underline-offset-2 hover:text-ink">
                Change it on My account
              </Link>
            </p>
          )}
          {f.key === "email" && !signedInEmail && onSignedIn && customerAuth && <ConfirmEmail email={value.email} onSignedIn={onSignedIn} />}
          {errors[f.key] && (
            <p id={`customer-${f.key}-error`} className="mt-1 text-xs text-red-600">
              {errors[f.key]}
            </p>
          )}
        </div>
      ))}
      <div>
        <label htmlFor="customer-notes" className="text-sm font-medium">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="customer-notes"
          name="notes"
          rows={3}
          value={value.notes ?? ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Anything we should know: hair history, allergies, access needs…"
          className={inputClass}
        />
      </div>
      <p className="text-xs text-muted">
        {deposit
          ? `A ${formatPrice(deposit.now)} deposit is paid online on the next step to secure your appointment. The remaining ${formatPrice(deposit.atSalon)} is paid in the salon. We'll email your confirmation.`
          : "No payment is taken online. We'll email your confirmation."}{" "}
        <a href="/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          How we use your details
        </a>
        .
      </p>
    </form>
  );
}

const linkClass = "underline underline-offset-2 hover:text-ink";

/**
 * "Got a membership or been with us before? Confirm this email": signs them in with a code sent to the email
 * they typed, without leaving the form, so their membership visits and details apply. The same offer for
 * everyone: it never reveals whether an email belongs to a member.
 */
function ConfirmEmail({ email, onSignedIn }: { email: string; onSignedIn: (s: CustomerSession) => void }) {
  const [phase, setPhase] = useState<"offer" | "code">("offer");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const auth = customerAuth!;
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const send = () =>
    run(async () => {
      await auth.sendCode(email.trim());
      setSentTo(email.trim());
      setCode("");
      setNote(null);
      setPhase("code");
    });
  const verify = () =>
    run(async () => {
      try {
        const result = await auth.verifyCode(code);
        if (result === "code_sent") {
          setCode("");
          setNote("Thanks, your email is confirmed. We've sent one more code to sign you in.");
        } else onSignedIn(result);
      } catch (err) {
        if (err instanceof CodeError) setCode("");
        throw err;
      }
    });

  // The email changed after the code was sent: start again.
  if (phase === "code" && sentTo !== email.trim()) setPhase("offer");

  return (
    <div className="mt-2 text-xs text-muted">
      {phase === "offer" ? (
        <p>
          Got a membership or been with us before?{" "}
          <button type="button" className={linkClass} disabled={busy || !valid} onClick={() => void send()}>
            {busy ? "Sending a code…" : "Confirm this email"}
          </button>{" "}
          to use your visits and fill in your details.
        </p>
      ) : (
        <div className="space-y-2 rounded-xl border border-line p-3">
          <p role="status">{note ?? `We've sent a 6-digit code to ${sentTo}. It may take a minute to arrive.`}</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                // Inside the booking form: Enter confirms the code, not the booking.
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (code.replace(/\D/g, "").length >= 6) void verify();
                }
              }}
              className="w-32 rounded-lg border border-line px-3 py-2 text-sm tracking-widest outline-none focus:border-gold"
              autoFocus
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
              disabled={busy || code.replace(/\D/g, "").length < 6}
              onClick={() => void verify()}
            >
              {busy && <Spinner />} Confirm
            </button>
            <button type="button" className={linkClass} onClick={() => void send()} disabled={busy}>
              Resend
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-1 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
