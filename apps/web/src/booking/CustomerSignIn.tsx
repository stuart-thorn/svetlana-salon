import { useState, type FormEvent } from "react";
import { CodeError, type CustomerSession } from "@salon/booking";
import type { CustomerState } from "./customer";
import { customerAuth } from "./provider";
import { Spinner } from "./ui";
import { visitsText } from "./memberships";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors focus:border-gold sm:text-sm";
const buttonClass = "inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50";
const linkClass = "underline underline-offset-2 hover:text-ink";

/**
 * "Been with us before?": an optional sign-in with a code sent by email, so the booking can suggest who they
 * saw last and fill in their details. Signed in, it says who they are, with a way out.
 */
export function CustomerSignIn({
  state,
  onSignedIn,
  onSignOut,
  startOpen = false,
}: {
  state: CustomerState;
  onSignedIn: (s: CustomerSession) => void;
  onSignOut: () => void;
  /** Show the email box straight away (where signing in is required, not optional). */
  startOpen?: boolean;
}) {
  const [phase, setPhase] = useState<"closed" | "email" | "code">(startOpen ? "email" : "closed");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (state.status === "off" || !customerAuth) return null;
  const auth = customerAuth;

  if (state.status === "signed_in") {
    const first = state.profile?.customer?.firstName ?? state.profile?.customer?.name.split(" ")[0];
    const memberships = (state.profile?.memberships ?? []).filter((m) => m.current && m.allowances.length > 0);
    return (
      <div className="text-sm text-muted">
        <p>
          {first ? `Welcome back, ${first}. ` : "Signed in. "}
          You're booking as <span className="text-ink">{state.session.email}</span>.{" "}
          <button type="button" className={linkClass} onClick={onSignOut}>
            Not you?
          </button>
        </p>
        {memberships.map((m) => (
          <p key={m.id} className="mt-1 text-ink">
            Your {m.name}: {visitsText(m)}. Visits are used automatically for the services they cover.
          </p>
        ))}
      </div>
    );
  }

  if (phase === "closed") {
    return (
      <p className="text-sm text-muted">
        Been with us before?{" "}
        <button type="button" className={linkClass} onClick={() => setPhase("email")}>
          Sign in for faster booking
        </button>
      </p>
    );
  }

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

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email address.");
    void run(async () => {
      await auth.sendCode(email);
      setCode("");
      setNote(null);
      setPhase("code");
    });
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
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
  };

  return (
    <section aria-labelledby="sign-in-heading" className="max-w-md rounded-2xl border border-line p-5">
      <h2 id="sign-in-heading" className="font-medium">
        Sign in
      </h2>
      {phase === "email" ? (
        <form onSubmit={sendCode} noValidate className="mt-3 space-y-3">
          <p className="text-sm text-muted">We'll email you a 6-digit code. No password needed.</p>
          <label className="block text-sm font-medium">
            Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoFocus />
          </label>
          <div className="flex items-center gap-4">
            <button type="submit" className={buttonClass} disabled={busy}>
              {busy && <Spinner />} Email me a code
            </button>
            <button type="button" className={`text-sm text-muted ${linkClass}`} onClick={() => setPhase("closed")}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="mt-3 space-y-3">
          <p role="status" className="text-sm text-muted">
            {note ?? (
              <>
                We've sent a code to <span className="text-ink">{email.trim()}</span>. It may take a minute to arrive.
              </>
            )}
          </p>
          <label className="block text-sm font-medium">
            Code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${inputClass} tracking-widest`}
              autoFocus
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className={buttonClass} disabled={busy || code.replace(/\D/g, "").length < 6}>
              {busy && <Spinner />} Sign in
            </button>
            <button type="button" className={`text-sm text-muted ${linkClass}`} onClick={() => setPhase("email")}>
              Use another email or resend
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
