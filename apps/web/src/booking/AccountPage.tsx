import { useEffect, useState, type FormEvent } from "react";
import type { AccountVisit, CustomerProfile } from "@salon/booking";
import { Link } from "../router";
import { salon } from "../data/content";
import { useCustomer } from "./customer";
import { CustomerSignIn } from "./CustomerSignIn";
import { visitsText } from "./memberships";
import { isTestMode, provider } from "./provider";
import { Notice, Spinner, formatLongDate } from "./ui";

const input = "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors focus:border-accent sm:text-sm";
const button = "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white cta-hover disabled:opacity-60";
const heading = "text-xs font-medium tracking-[0.2em] text-muted uppercase";

/**
 * /account: the signed-in customer's own page. Their details (name and phone; the email is how they sign in),
 * memberships with visits left, bookings to come and recent visits.
 */
export default function AccountPage() {
  const { state, signedIn, signOut } = useCustomer();
  const [profile, setProfile] = useState<CustomerProfile | undefined>(undefined);
  useEffect(() => {
    if (state.status === "signed_in") setProfile(state.profile);
    else setProfile(undefined);
  }, [state]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-serif text-lg">
            {salon.name}
          </Link>
          <Link to="/book" className="text-sm text-muted hover:text-ink">
            Book an appointment
          </Link>
        </div>
        {isTestMode && <p className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">Test mode: this is the test booking system.</p>}
      </header>
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl">My account</h1>
        {state.status === "off" ? (
          <div className="mt-6">
            <Notice>Accounts aren't available right now.</Notice>
          </div>
        ) : state.status !== "signed_in" ? (
          <div className="mt-6">
            <p className="mb-4 text-muted">Sign in with your email to see your bookings and memberships and update your details.</p>
            <CustomerSignIn state={state} onSignedIn={signedIn} onSignOut={signOut} startOpen />
          </div>
        ) : !profile ? (
          <p className="mt-6 flex items-center gap-2 text-muted">
            <Spinner /> Loading…
          </p>
        ) : (
          <div className="mt-8 space-y-10">
            <Details profile={profile} onSaved={setProfile} onSignOut={signOut} />
            <Memberships profile={profile} />
            <Visits title="Coming up" visits={profile.upcoming} empty="Nothing booked." manage />
            <Visits title="Recent visits" visits={profile.recent} />
          </div>
        )}
      </main>
    </div>
  );
}

function Details({ profile, onSaved, onSignOut }: { profile: CustomerProfile; onSaved: (p: CustomerProfile) => void; onSignOut: () => void }) {
  const c = profile.customer;
  const [firstName, setFirstName] = useState(c?.firstName ?? c?.name.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(c?.lastName ?? c?.name.split(" ").slice(1).join(" ") ?? "");
  const [phone, setPhone] = useState(c?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const changed = firstName !== (c?.firstName ?? "") || lastName !== (c?.lastName ?? "") || phone !== (c?.phone ?? "");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!provider.updateCustomerProfile) return;
    if (!firstName.trim() && !lastName.trim()) return setError("Please enter your name.");
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      onSaved(await provider.updateCustomerProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() }));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your details weren't saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className={heading}>Your details</h2>
      <form onSubmit={save} className="mt-3 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            First name
            <input className={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          </label>
          <label className="block text-sm">
            Last name
            <input className={input} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </label>
        </div>
        <label className="block text-sm">
          Mobile number
          <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
        </label>
        <div className="text-sm">
          Email
          <p className="mt-1.5 text-muted">
            {profile.email}{" "}
            <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={onSignOut}>
              Sign out
            </button>
          </p>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex items-center gap-3">
          <button type="submit" className={button} disabled={busy || !changed}>
            {busy && <Spinner />} Save
          </button>
          {saved && !changed && <span className="text-sm text-muted">Saved.</span>}
        </div>
      </form>
    </section>
  );
}

function Memberships({ profile }: { profile: CustomerProfile }) {
  const memberships = profile.memberships ?? [];
  return (
    <section>
      <h2 className={heading}>Memberships and packages</h2>
      {memberships.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          None yet.{" "}
          <Link to="/buy?from=account" className="underline underline-offset-2 hover:text-ink">
            See memberships and packages
          </Link>
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {memberships.map((m) => (
            <li key={m.id} className="rounded-2xl border border-line p-5">
              <p className="font-medium">{m.name}</p>
              <p className="mt-1 text-sm text-muted">
                {m.current ? "Active" : `Starts ${formatLongDate(m.validFrom)}`}
                {m.validTo ? `, until ${formatLongDate(m.validTo)}` : ", no expiry"}
              </p>
              {m.allowances.length > 0 && <p className="mt-2 text-sm">{visitsText(m)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Visits({ title, visits = [], empty, manage = false }: { title: string; visits?: AccountVisit[]; empty?: string; manage?: boolean }) {
  if (visits.length === 0 && !empty) return null;
  return (
    <section>
      <h2 className={heading}>{title}</h2>
      {visits.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
          {visits.map((v, i) => (
            <li key={v.reference ?? `${v.date}-${i}`} className="flex justify-between gap-4 py-3">
              <span>
                <span className="font-medium">{formatLongDate(v.date)}</span>
                {v.time && <span className="text-muted"> {v.time}</span>}
                <span className="block text-muted">
                  {v.services.join(", ")}
                  {v.stylistName && ` with ${v.stylistName}`}
                </span>
              </span>
              {v.reference && (
                <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted">
                  {v.reference}
                  {manage && (
                    <Link to={`/manage?ref=${encodeURIComponent(v.reference)}`} className="text-sm text-ink underline underline-offset-2 hover:text-accent">
                      Change or cancel
                    </Link>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
