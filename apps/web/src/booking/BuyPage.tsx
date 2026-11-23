import { useEffect, useRef, useState, type FormEvent } from "react";
import { PaymentsUnavailableError, formatPrice, type Purchase } from "@salon/booking";
import { productDetail, visitsText } from "./memberships";
import { Link, scrollToTop, useLocation } from "../router";
import { salon } from "../data/content";
import { useCustomer } from "./customer";
import { CustomerSignIn } from "./CustomerSignIn";
import { isTestMode, provider } from "./provider";
import { stripeFor, type StripeElements, type StripeInstance } from "./stripe";
import { useAsync } from "./useAsync";
import { Notice, Spinner, formatLongDate } from "./ui";

const button =
  "mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold disabled:opacity-60";
const input = "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors focus:border-gold sm:text-sm";

const CONFIRM_TIMEOUT_MS = 30_000;
const POLL_MS = 1_500;

/**
 * /buy?product=<id>: a signed-in customer buys a membership or package. Sign in (so it goes on their own
 * record), check the details, pay with the card form, then wait for the payment to go through.
 */
export default function BuyPage() {
  const { search } = useLocation();
  const productId = search.get("product") ?? "";
  const { data: catalog, error: catalogError } = useAsync(() => provider.getCatalog(), []);
  const product = catalog?.products?.find((p) => p.id === productId);
  const { state: customerState, signedIn, signOut } = useCustomer();
  const profile = customerState.status === "signed_in" ? customerState.profile : undefined;
  const email = customerState.status === "signed_in" ? customerState.session.email : "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    if (profile?.customer) {
      setName((n) => n || profile.customer!.name);
      setPhone((p) => p || profile.customer!.phone || "");
    }
  }, [profile]);

  const start = async (e: FormEvent) => {
    e.preventDefault();
    if (!product || !provider.buyProducts || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setPurchase(await provider.buyProducts({ lines: [{ productId: product.id, quantity: 1 }], customer: { name: name.trim(), email, ...(phone.trim() && { phone: phone.trim() }) } }));
      scrollToTop();
    } catch (err) {
      setError(err instanceof PaymentsUnavailableError ? "We can't take payments online at the moment. Please ask in the salon." : err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
          <Link to="/#offers" className="text-sm text-muted hover:text-ink">
            Back to offers
          </Link>
        </div>
        {isTestMode && <p className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">Test mode: purchases go to the test system and payments are simulated.</p>}
      </header>
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        {catalogError && <Notice tone="error">We couldn't load this page. Please refresh, or ask in the salon.</Notice>}
        {!catalog && !catalogError && (
          <p className="flex items-center gap-2 text-muted">
            <Spinner /> Loading…
          </p>
        )}
        {catalog && !product && productId && <Notice>This isn't available to buy online. Please ask in the salon.</Notice>}
        {catalog && !productId && (
          <>
            <h1 className="font-serif text-3xl">Memberships and packages</h1>
            <p className="mt-3 text-muted">Pay once, then your included visits are used automatically when you book signed in.</p>
            {(catalog.products ?? []).length === 0 ? (
              <div className="mt-6">
                <Notice>Nothing is available to buy online at the moment. Please ask in the salon.</Notice>
              </div>
            ) : (
              <ul className="mt-8 space-y-4">
                {(catalog.products ?? []).map((p) => (
                  <li key={p.id} className="rounded-2xl border border-line p-6">
                    <p className="flex justify-between gap-4 font-medium">
                      <span>{p.name}</span>
                      <span>{formatPrice(p.price)}</span>
                    </p>
                    {p.membership && <p className="mt-1 text-sm text-muted">{productDetail(p)}</p>}
                    {p.description && <p className="mt-2 text-sm text-muted">{p.description}</p>}
                    <Link
                      to={`/buy?product=${encodeURIComponent(p.id)}`}
                      className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-gold"
                    >
                      Buy
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {product && !purchase && (
          <>
            <h1 className="font-serif text-3xl">{product.name}</h1>
            <div className="mt-6 rounded-2xl border border-line p-6">
              <p className="flex justify-between font-medium">
                <span>{product.name}</span>
                <span>{formatPrice(product.price)}</span>
              </p>
              {product.membership && <p className="mt-1 text-sm text-muted">{productDetail(product)}</p>}
              {product.description && <p className="mt-3 text-sm text-muted">{product.description}</p>}
              <p className="mt-3 text-xs text-muted">One payment now, no Direct Debit. Visits are used automatically when you book while signed in.</p>
            </div>

            {customerState.status === "off" ? (
              <div className="mt-6">
                <Notice>Buying online isn't available right now. Please ask in the salon.</Notice>
              </div>
            ) : customerState.status !== "signed_in" ? (
              <div className="mt-8">
                <p className="mb-3 text-sm text-muted">Sign in with your email so it's linked to you and used when you book.</p>
                <CustomerSignIn state={customerState} onSignedIn={signedIn} onSignOut={signOut} startOpen />
              </div>
            ) : (
              <form onSubmit={start} className="mt-8 space-y-4">
                <CustomerSignIn state={customerState} onSignedIn={signedIn} onSignOut={signOut} />
                <label className="block text-sm">
                  Your name
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </label>
                <label className="block text-sm">
                  Phone (optional)
                  <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
                </label>
                {error && <Notice tone="error">{error}</Notice>}
                <button type="submit" className={button} disabled={busy || !name.trim()}>
                  {busy && <Spinner />}
                  Continue to payment
                </button>
              </form>
            )}
          </>
        )}
        {purchase && <PayForPurchase purchase={purchase} onPaid={setPurchase} />}
      </main>
    </div>
  );
}

/** Pays for a pending purchase, then shows what it gave. */
function PayForPurchase({ purchase, onPaid }: { purchase: Purchase; onPaid: (p: Purchase) => void }) {
  if (purchase.status === "paid") {
    return (
      <div>
        <h1 className="font-serif text-3xl">Thank you</h1>
        <p className="mt-3 text-muted">
          Your payment has gone through ({purchase.reference}). {purchase.memberships.length > 0 && "Your membership is ready to use:"}
        </p>
        {purchase.memberships.map((m) => (
          <div key={m.id} className="mt-6 rounded-2xl border border-line p-6">
            <p className="font-medium">{m.name}</p>
            <p className="mt-1 text-sm text-muted">
              {m.current ? "Starts today" : `Starts ${formatLongDate(m.validFrom)}`}
              {m.validTo ? `, until ${formatLongDate(m.validTo)}` : ""}
            </p>
            <p className="mt-2 text-sm">{visitsText(m)}</p>
          </div>
        ))}
        <p className="mt-6 text-sm text-muted">Book while signed in with this email and your visits are used automatically.</p>
        <Link to="/book" className={`${button} mt-8`}>
          Book an appointment
        </Link>
      </div>
    );
  }
  return (
    <div>
      <h1 className="font-serif text-3xl">Pay for your {purchase.lines.map((l) => l.name).join(", ")}</h1>
      <p className="mt-3 flex justify-between border-b border-line pb-4 font-medium">
        <span>Total</span>
        <span>{formatPrice(purchase.total)}</span>
      </p>
      {purchase.payment?.kind === "stripe" && provider.getPurchase ? (
        <StripePay payment={purchase.payment} amount={purchase.total} waitForPaid={() => waitForPaid(purchase)} onPaid={onPaid} />
      ) : (
        <SimulatedPay purchase={purchase} onPaid={onPaid} />
      )}
    </div>
  );
}

/** Polls until the payment webhook has marked the purchase paid (or the wait is too long). */
async function waitForPaid(purchase: Purchase): Promise<Purchase | null> {
  const until = Date.now() + CONFIRM_TIMEOUT_MS;
  while (Date.now() < until) {
    try {
      const now = await provider.getPurchase!(purchase);
      if (now.status === "paid") return now;
    } catch {
      // A blip: keep waiting.
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return null;
}

function SimulatedPay({ purchase, onPaid }: { purchase: Purchase; onPaid: (p: Purchase) => void }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pay = async () => {
    if (!provider.completeSimulatedPurchase) return;
    setPaying(true);
    setError(null);
    try {
      onPaid(await provider.completeSimulatedPurchase(purchase));
    } catch {
      setError("The payment didn't go through. Please try again.");
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
        Pay {formatPrice(purchase.total)} (simulated)
      </button>
      <p className="mt-3 text-center text-xs text-muted">Test mode: no card is needed and no money is taken.</p>
    </>
  );
}

/** Stripe's Payment Element, then waiting for the payment to go through. */
function StripePay({
  payment,
  amount,
  waitForPaid,
  onPaid,
}: {
  payment: { clientSecret: string; publishableKey: string; accountRef?: string };
  amount: number;
  waitForPaid: () => Promise<Purchase | null>;
  onPaid: (p: Purchase) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripe = useRef<{ instance: StripeInstance; elements: StripeElements } | null>(null);
  const [state, setState] = useState<"loading" | "unavailable" | "ready" | "paying" | "confirming" | "slow">("loading");
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let element: ReturnType<StripeElements["create"]> | undefined;
    stripeFor(payment.publishableKey, payment.accountRef).then(
      (instance) => {
        if (cancelled || !mountRef.current) return;
        const elements = instance.elements({
          clientSecret: payment.clientSecret,
          fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" }],
          appearance: { theme: "stripe", variables: { colorPrimary: "#1c1917", colorText: "#1c1917", fontFamily: "Inter, system-ui, sans-serif", borderRadius: "12px" } },
        });
        element = elements.create("payment", { layout: "tabs" });
        element.on("ready", () => !cancelled && setState("ready"));
        element.on("change", (e) => setComplete(Boolean(e.complete)));
        element.mount(mountRef.current);
        stripe.current = { instance, elements };
      },
      () => !cancelled && setState("unavailable"),
    );
    return () => {
      cancelled = true;
      element?.destroy();
    };
  }, [payment.clientSecret, payment.publishableKey, payment.accountRef]);

  const pay = async () => {
    const s = stripe.current;
    if (!s) return;
    setError(null);
    setState("paying");
    const submitted = await s.elements.submit();
    if (submitted.error) {
      setError(submitted.error.message ?? "Please check your card details.");
      return setState("ready");
    }
    const result = await s.instance.confirmPayment({ elements: s.elements, redirect: "if_required", confirmParams: { return_url: window.location.href } });
    if (result.error) {
      const forCustomer = result.error.type === "card_error" || result.error.type === "validation_error";
      setError(forCustomer && result.error.message ? result.error.message : "The payment didn't go through. Please try again.");
      return setState("ready");
    }
    setState("confirming");
    const paid = await waitForPaid();
    if (paid) onPaid(paid);
    else setState("slow");
  };

  if (state === "unavailable") {
    return (
      <div className="mt-6">
        <Notice tone="error">We couldn't load the card form. Please check your connection and refresh.</Notice>
      </div>
    );
  }
  if (state === "confirming" || state === "slow") {
    return (
      <div className="mt-8 text-center">
        {state === "confirming" ? (
          <p className="flex items-center justify-center gap-2 text-muted">
            <Spinner /> Payment received. Setting up your membership…
          </p>
        ) : (
          <Notice>Your payment has gone through and we're still setting it up. It will be ready in a few minutes; there's no need to pay again.</Notice>
        )}
      </div>
    );
  }
  return (
    <>
      <div className="mt-8 min-h-24">
        {state === "loading" && (
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
      <button type="button" onClick={pay} disabled={state !== "ready" || !complete} className={button}>
        {state === "paying" && <Spinner />}
        Pay {formatPrice(amount)}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        {payment.publishableKey.startsWith("pk_test_") ? "Test mode: use card 4242 4242 4242 4242, any future date and any CVC. " : ""}
        Payments are handled securely by Stripe. We never see your card details.
      </p>
    </>
  );
}
