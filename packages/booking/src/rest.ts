import {
  BookingExpiredError,
  IncompatibleServicesError,
  PaymentsUnavailableError,
  SlotUnavailableError,
  type AccountVisit,
  type BookingConfirmation,
  type BookingProvider,
  type BookingRequest,
  type Catalog,
  type CustomerProfile,
  type DayAvailability,
  type ManageAccess,
  type ManagedBooking,
  type OnlinePayment,
  type MembershipSummary,
  type OpeningHours,
  type Product,
  type Purchase,
  type Service,
} from "./types";
import { timeToMinutes } from "./utils";

/** Talks to the Bookable public API (bookable-agent, /v1). */
export interface RestProviderOptions {
  /** e.g. "http://localhost:7100/v1" */
  baseUrl: string;
  /** Publishable key, pk_live_… or pk_test_… */
  apiKey: string;
  locationId: string;
  fetch?: typeof fetch;
  /** The signed-in customer's ID token, sent with bookings and profile reads (customer sign-in, §4.4). */
  customerToken?: () => string | undefined;
}

// ── API shapes (subset of bookable-agent's @bookable/types) ────────────────────────
interface ApiMoney {
  amount: number;
  currency: string;
}
type ApiPayment =
  | { kind: "none" | "card_on_file" | "full" }
  | { kind: "deposit"; percent?: number; fixed?: ApiMoney };
interface ApiPolicyOverrides {
  policyOverrides?: { payment?: ApiPayment };
}
interface ApiCatalog {
  tenant: {
    name: string;
    policies: { payment: ApiPayment; cancellationWindowHours?: number };
    audiencesPrompt?: string;
    sellsMemberships?: boolean;
  };
  locations: {
    id: string;
    kind: string;
    openingHours?: ({ open: string; close: string } | null)[];
  }[];
  categories: ({ id: string; name: string } & ApiPolicyOverrides)[];
  /** Absent from catalogues published before audiences existed. */
  audiences?: { id: string; name: string; description?: string }[];
  offerings: ({
    id: string;
    categoryId: string;
    name: string;
    description?: string;
    durationMin: number;
    basePrice: ApiMoney;
    priceFrom?: boolean;
  } & ApiPolicyOverrides &
    Pick<
      Service,
      "audienceIds" | "standalone" | "addOnTo" | "exclusiveGroup"
    >)[];
  providers: { id: string; name: string; title?: string; photoUrl?: string }[];
  skills: {
    providerId: string;
    offeringId: string;
    price: ApiMoney;
    durationMin: number;
  }[];
  products?: {
    id: string;
    name: string;
    description?: string;
    kind: "membership" | "retail";
    price: ApiMoney;
    membership?: {
      termMonths?: number;
      tier?: string;
      allowances?: { id: string; label: string; count: number }[];
    };
  }[];
}
interface ApiBooking {
  id: string;
  reference: string;
  status: string;
  providerId: string;
  items: { offeringId: string }[];
  date: string;
  time: string;
  endTime: string;
  durationMin: number;
  total: ApiMoney;
  depositDue: ApiMoney;
  balanceDue: ApiMoney;
  amountPaid: ApiMoney;
  expiresAt?: string;
  payment?:
    | {
        kind: "client_secret";
        gateway: string;
        clientSecret: string;
        publishableKey?: string;
        accountRef?: string;
      }
    | { kind: "simulated" }
    | { kind: string }
    | null;
}
interface ApiMembership {
  id: string;
  name: string;
  tier?: string;
  validFrom: string;
  validTo?: string;
  current: boolean;
  allowances: {
    id: string;
    label: string;
    count: number;
    offeringIds?: string[];
  }[];
  remaining: Record<string, number>;
}
interface ApiOrder {
  id: string;
  reference: string;
  status: Purchase["status"];
  lines: { name: string; quantity: number }[];
  total: ApiMoney;
  memberships: ApiMembership[];
  payment: { clientAction: NonNullable<ApiBooking["payment"]> } | null;
}
interface ApiAccountVisit {
  date: string;
  time?: string;
  reference?: string;
  status?: string;
  services: string[];
  providerName?: string;
}
interface ApiCustomerProfile {
  upcoming?: ApiAccountVisit[];
  recent?: ApiAccountVisit[];
  memberships?: ApiMembership[];
  email: string;
  customer?: {
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    lastVisit?: {
      date: string;
      providerId?: string;
      providerName?: string;
      services: string[];
      offeringIds?: string[];
    };
  };
}
interface ApiProblem {
  code?: string;
  detail?: string;
}

const pounds = (m: ApiMoney) => m.amount / 100;

interface ApiManagedBooking {
  reference: string;
  status: string;
  date: string;
  time: string;
  end: string;
  services: {
    offeringId: string;
    name: string;
    providerId: string;
    providerName?: string;
  }[];
  total: ApiMoney;
  amountPaid: ApiMoney;
  cancellation?: {
    deadline: string;
    windowHours: number;
    late: boolean;
    refund: ApiMoney;
    kept: ApiMoney;
    usesVisits: boolean;
    visitsReturned: boolean;
  };
  canCancel: boolean;
  canReschedule: boolean;
  cancelled?: {
    at: string;
    byCustomer: boolean;
    refund: ApiMoney;
    kept: ApiMoney;
  };
}

function toManaged(b: ApiManagedBooking): ManagedBooking {
  return {
    reference: b.reference,
    status: b.status,
    date: b.date,
    time: b.time,
    end: b.end,
    services: b.services.map((s) => ({
      serviceId: s.offeringId,
      name: s.name,
      stylistId: s.providerId,
      ...(s.providerName && { stylistName: s.providerName }),
    })),
    total: pounds(b.total),
    paid: pounds(b.amountPaid),
    ...(b.cancellation && {
      cancellation: {
        ...b.cancellation,
        refund: pounds(b.cancellation.refund),
        kept: pounds(b.cancellation.kept),
      },
    }),
    canCancel: b.canCancel,
    canReschedule: b.canReschedule,
    ...(b.cancelled && {
      cancelled: {
        ...b.cancelled,
        refund: pounds(b.cancelled.refund),
        kept: pounds(b.cancelled.kept),
      },
    }),
  };
}

function toMembership(m: ApiMembership): MembershipSummary {
  return {
    id: m.id,
    name: m.name,
    ...(m.tier && { tier: m.tier }),
    validFrom: m.validFrom,
    ...(m.validTo && { validTo: m.validTo }),
    current: m.current,
    allowances: m.allowances.map((a) => ({
      label: a.label,
      count: a.count,
      left: m.remaining[a.id] ?? 0,
      offeringIds: a.offeringIds ?? [],
    })),
  };
}

const toVisit = (v: ApiAccountVisit): AccountVisit => ({
  date: v.date,
  ...(v.time && { time: v.time }),
  ...(v.reference && { reference: v.reference }),
  ...(v.status && { status: v.status }),
  services: v.services,
  ...(v.providerName && { stylistName: v.providerName }),
});

function toProfile(p: ApiCustomerProfile): CustomerProfile {
  const c = p.customer;
  const v = c?.lastVisit;
  return {
    email: p.email,
    ...(c && {
      customer: {
        name: c.name,
        ...(c.firstName && { firstName: c.firstName }),
        ...(c.lastName && { lastName: c.lastName }),
        ...(c.phone && { phone: c.phone }),
        ...(v && {
          lastVisit: {
            date: v.date,
            ...(v.providerId && { stylistId: v.providerId }),
            ...(v.providerName && { stylistName: v.providerName }),
            services: v.services,
            serviceIds: v.offeringIds ?? [],
          },
        }),
      },
    }),
    ...(p.memberships?.length && {
      memberships: p.memberships.map(toMembership),
    }),
    ...(p.upcoming?.length && { upcoming: p.upcoming.map(toVisit) }),
    ...(p.recent?.length && { recent: p.recent.map(toVisit) }),
  };
}

export function toPurchase(o: ApiOrder): Purchase {
  return {
    orderId: o.id,
    reference: o.reference,
    status: o.status,
    total: pounds(o.total),
    lines: o.lines.map((l) => ({ name: l.name, quantity: l.quantity })),
    memberships: o.memberships.map(toMembership),
    ...(o.status === "pending_payment" &&
      o.payment && { payment: toOnlinePayment(o.payment.clientAction) }),
  };
}

/** What is paid online for a service: offering override, else category override, else tenant default. */
function depositOf(payment: ApiPayment): Service["deposit"] {
  if (payment.kind === "full") return { percent: 100 };
  if (payment.kind !== "deposit") return undefined;
  if (payment.percent !== undefined) return { percent: payment.percent };
  return payment.fixed ? { amount: pounds(payment.fixed) } : undefined;
}

export function toCatalog(api: ApiCatalog, locationId: string): Catalog {
  const location = api.locations.find((l) => l.id === locationId);
  const openingHours: (OpeningHours | null)[] = Array.from(
    { length: 7 },
    (_, d) => {
      const h = location?.openingHours?.[d];
      return h
        ? { open: timeToMinutes(h.open), close: timeToMinutes(h.close) }
        : null;
    },
  );
  return {
    ...(api.tenant.policies.cancellationWindowHours
      ? {
          cancellation: {
            windowHours: api.tenant.policies.cancellationWindowHours,
          },
        }
      : {}),
    salonName: api.tenant.name,
    ...(api.tenant.audiencesPrompt && {
      audiencesPrompt: api.tenant.audiencesPrompt,
    }),
    ...(api.tenant.sellsMemberships && { sellsMemberships: true }),
    categories: api.categories.map(({ id, name }) => ({ id, name })),
    audiences: (api.audiences ?? []).map(({ id, name, description }) => ({
      id,
      name,
      ...(description && { description }),
    })),
    services: api.offerings.map((o): Service => {
      const category = api.categories.find((c) => c.id === o.categoryId);
      const deposit = depositOf(
        o.policyOverrides?.payment ??
          category?.policyOverrides?.payment ??
          api.tenant.policies.payment,
      );
      return {
        id: o.id,
        categoryId: o.categoryId,
        name: o.name,
        ...(o.description && { description: o.description }),
        durationMin: o.durationMin,
        price: pounds(o.basePrice),
        ...(o.priceFrom && { priceFrom: true }),
        ...(deposit && { deposit }),
        ...(o.audienceIds && { audienceIds: o.audienceIds }),
        ...(o.standalone === false && { standalone: false }),
        ...(o.addOnTo && { addOnTo: o.addOnTo }),
        ...(o.exclusiveGroup && { exclusiveGroup: o.exclusiveGroup }),
      };
    }),
    stylists: api.providers.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.title ?? "",
      ...(p.photoUrl && { photoUrl: p.photoUrl }),
      serviceIds: api.skills
        .filter((s) => s.providerId === p.id)
        .map((s) => s.offeringId),
      // Working patterns live in the API's availability; only the mock uses this.
      workingDays: [0, 1, 2, 3, 4, 5, 6],
    })),
    openingHours,
    ...(api.products?.length && {
      products: api.products.map((p): Product => ({
        id: p.id,
        name: p.name,
        ...(p.description && { description: p.description }),
        kind: p.kind,
        price: pounds(p.price),
        ...(p.membership && {
          membership: {
            ...(p.membership.termMonths && {
              termMonths: p.membership.termMonths,
            }),
            ...(p.membership.tier && { tier: p.membership.tier }),
            allowances: (p.membership.allowances ?? []).map(
              ({ id, label, count }) => ({ id, label, count }),
            ),
          },
        }),
      })),
    }),
  };
}

export function toConfirmation(b: ApiBooking): BookingConfirmation {
  const hasDeposit = b.depositDue.amount > 0;
  return {
    reference: b.reference,
    stylistId: b.providerId,
    serviceIds: b.items.map((i) => i.offeringId),
    date: b.date,
    time: b.time,
    endTime: b.endTime,
    durationMin: b.durationMin,
    total: pounds(b.total),
    bookingId: b.id,
    status: b.status === "pending_payment" ? "pending_payment" : "confirmed",
    ...(hasDeposit && {
      deposit: {
        now: pounds(b.depositDue),
        atSalon: pounds(b.balanceDue),
        paid: b.amountPaid.amount >= b.depositDue.amount,
      },
    }),
    ...(b.expiresAt && { expiresAt: b.expiresAt }),
    ...(b.status === "pending_payment" &&
      b.payment && { payment: toOnlinePayment(b.payment) }),
  };
}

function toOnlinePayment(p: NonNullable<ApiBooking["payment"]>): OnlinePayment {
  if (p.kind === "client_secret" && "clientSecret" in p && p.publishableKey) {
    return {
      kind: "stripe",
      clientSecret: p.clientSecret,
      publishableKey: p.publishableKey,
      ...(p.accountRef && { accountRef: p.accountRef }),
    };
  }
  return { kind: "simulated" };
}

const managePath = (a: ManageAccess) =>
  `/bookings/${encodeURIComponent(a.reference)}${a.token ? `?token=${encodeURIComponent(a.token)}` : ""}`;

export function createRestProvider(
  options: RestProviderOptions,
): BookingProvider &
  Required<
    Pick<
      BookingProvider,
      | "completeSimulatedPayment"
      | "getCustomerProfile"
      | "updateCustomerProfile"
      | "getBookingStatus"
      | "buyProducts"
      | "getPurchase"
      | "completeSimulatedPurchase"
      | "getManagedBooking"
      | "cancelManagedBooking"
      | "rescheduleManagedBooking"
    >
  > {
  const { baseUrl, apiKey, locationId, customerToken } = options;
  const signedIn = (): Record<string, string> => {
    const token = customerToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));

  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await doFetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        "X-Api-Key": apiKey,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    if (res.ok) return (await res.json()) as T;
    const problem = (await res.json().catch(() => ({}))) as ApiProblem;
    if (problem.code === "slot_unavailable") throw new SlotUnavailableError();
    if (problem.code === "booking_expired") throw new BookingExpiredError();
    if (problem.code === "payment_required")
      throw new PaymentsUnavailableError();
    if (problem.code === "incompatible_offerings")
      throw new IncompatibleServicesError(problem.detail);
    if (problem.code === "idempotency_conflict") {
      throw new Error(
        "We're still processing your booking. Please wait a moment, then check your email before trying again.",
      );
    }
    throw new Error(problem.detail ?? `Booking service error (${res.status})`);
  }

  // One Idempotency-Key per distinct booking request, so a retry of the same request (double click,
  // network retry) replays the API's stored response instead of making a second booking.
  const idempotencyKeys = new Map<string, string>();
  const idempotencyKeyFor = (body: string) => {
    let k = idempotencyKeys.get(body);
    if (!k) idempotencyKeys.set(body, (k = crypto.randomUUID()));
    return k;
  };

  const query = (params: Record<string, string | null | undefined>) =>
    new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => !!e[1]),
    ).toString();

  return {
    getCatalog: async () =>
      toCatalog(
        await call<ApiCatalog>(`/catalog?${query({ locationId })}`),
        locationId,
      ),

    getAvailableDates: ({ from, to, stylistId, serviceIds }) =>
      call<DayAvailability[]>(
        `/availability/dates?${query({ locationId, offeringIds: serviceIds.join(","), providerId: stylistId, from, to })}`,
      ),

    getTimeSlots: async ({ date, stylistId, serviceIds }) => {
      const slots = await call<{ time: string; providerIds: string[] }[]>(
        `/availability/slots?${query({ locationId, offeringIds: serviceIds.join(","), providerId: stylistId, date })}`,
      );
      return slots.map((s) => ({ time: s.time, stylistIds: s.providerIds }));
    },

    createBooking: async (request: BookingRequest) => {
      const body = JSON.stringify({
        locationId,
        providerId: request.stylistId,
        offeringIds: request.serviceIds,
        date: request.date,
        time: request.time,
        customer: request.customer,
      });
      return toConfirmation(
        await call<ApiBooking>("/bookings", {
          method: "POST",
          headers: {
            "Idempotency-Key": idempotencyKeyFor(body),
            ...signedIn(),
          },
          body,
        }),
      );
    },

    getCustomerProfile: async (): Promise<CustomerProfile> =>
      toProfile(await call<ApiCustomerProfile>("/me", { headers: signedIn() })),

    updateCustomerProfile: async (change) =>
      toProfile(
        await call<ApiCustomerProfile>("/me", {
          method: "PATCH",
          headers: signedIn(),
          body: JSON.stringify(change),
        }),
      ),

    buyProducts: async (request) => {
      const body = JSON.stringify({
        lines: request.lines,
        customer: request.customer,
      });
      return toPurchase(
        await call<ApiOrder>("/me/orders", {
          method: "POST",
          headers: {
            "Idempotency-Key": idempotencyKeyFor(body),
            ...signedIn(),
          },
          body,
        }),
      );
    },

    getPurchase: async (p) =>
      toPurchase(
        await call<ApiOrder>(`/me/orders/${encodeURIComponent(p.orderId)}`, {
          headers: signedIn(),
          cache: "no-store",
        }),
      ),

    completeSimulatedPurchase: async (p) => {
      await call<{ ok: boolean }>(
        `/orders/${encodeURIComponent(p.orderId)}/simulate-payment`,
        { method: "POST" },
      );
      return toPurchase(
        await call<ApiOrder>(`/me/orders/${encodeURIComponent(p.orderId)}`, {
          headers: signedIn(),
          cache: "no-store",
        }),
      );
    },

    getManagedBooking: async (a) =>
      toManaged(
        await call<ApiManagedBooking>(managePath(a), {
          headers: signedIn(),
          cache: "no-store",
        }),
      ),

    cancelManagedBooking: async (a) => {
      const body = JSON.stringify({ ...(a.token && { token: a.token }) });
      return toManaged(
        await call<ApiManagedBooking>(
          `/bookings/${encodeURIComponent(a.reference)}/cancel`,
          {
            method: "POST",
            headers: {
              "Idempotency-Key": idempotencyKeyFor(`cancel:${a.reference}`),
              ...signedIn(),
            },
            body,
          },
        ),
      );
    },

    rescheduleManagedBooking: async (a, to) => {
      const body = JSON.stringify({
        date: to.date,
        time: to.time,
        ...(a.token && { token: a.token }),
      });
      return toManaged(
        await call<ApiManagedBooking>(
          `/bookings/${encodeURIComponent(a.reference)}/reschedule`,
          {
            method: "POST",
            headers: {
              "Idempotency-Key": idempotencyKeyFor(
                `reschedule:${a.reference}:${to.date}:${to.time}`,
              ),
              ...signedIn(),
            },
            body,
          },
        ),
      );
    },

    getBookingStatus: async (c) => {
      if (!c.bookingId) throw new Error("Missing booking ID");
      return toConfirmation(
        await call<ApiBooking>(
          `/bookings/${encodeURIComponent(c.bookingId)}/status`,
          { cache: "no-store" },
        ),
      );
    },

    completeSimulatedPayment: async (c) => {
      if (!c.bookingId) throw new Error("Missing booking ID");
      return toConfirmation(
        await call<ApiBooking>(
          `/bookings/${encodeURIComponent(c.bookingId)}/simulate-payment`,
          { method: "POST" },
        ),
      );
    },
  };
}
