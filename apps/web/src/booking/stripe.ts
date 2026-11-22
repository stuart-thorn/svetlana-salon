/**
 * Stripe.js, loaded from js.stripe.com as Stripe requires (no npm package), with just the types we use.
 * Payments are direct charges on the salon's own Stripe account, so Stripe.js runs as that account
 * (`stripeAccount`) with the platform's publishable key.
 */

export interface StripeElement {
  mount(el: HTMLElement): void;
  destroy(): void;
  on(event: "ready" | "change", handler: (e: { complete?: boolean }) => void): void;
}

export interface StripeElements {
  create(type: "payment", options?: { layout?: "tabs" | "accordion" }): StripeElement;
  submit(): Promise<{ error?: { message?: string } }>;
}

export interface StripeInstance {
  elements(options: { clientSecret: string; appearance?: Record<string, unknown>; fonts?: unknown[] }): StripeElements;
  confirmPayment(options: {
    elements: StripeElements;
    redirect: "if_required";
    confirmParams?: { return_url?: string };
  }): Promise<{ error?: { type?: string; message?: string }; paymentIntent?: { status: string } }>;
}

type StripeFactory = (publishableKey: string, options?: { stripeAccount?: string; locale?: string }) => StripeInstance;

declare global {
  interface Window {
    Stripe?: StripeFactory;
  }
}

const SRC = "https://js.stripe.com/v3/";
let loading: Promise<StripeFactory> | undefined;

/** Loads Stripe.js once. Rejects if it can't be reached (offline, blocked). */
function loadStripeJs(): Promise<StripeFactory> {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  loading ??= new Promise<StripeFactory>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error("Stripe.js didn't load")));
    script.onerror = () => {
      loading = undefined;
      script.remove();
      reject(new Error("Stripe.js didn't load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function stripeFor(publishableKey: string, accountRef?: string): Promise<StripeInstance> {
  const Stripe = await loadStripeJs();
  return Stripe(publishableKey, { ...(accountRef && { stripeAccount: accountRef }), locale: "en-GB" });
}
