import type { Catalog, ClockTime, ISODate, MembershipSummary, PricedService, Service, Stylist } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISODate = (s: ISODate): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

export const addDays = (s: ISODate, days: number): ISODate => {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const dayOfWeek = (s: ISODate): number => parseISODate(s).getDay();

export const minutesToTime = (m: number): ClockTime => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

export const timeToMinutes = (t: ClockTime): number => {
  const [h, m] = t.split(":").map(Number);
  return h! * 60 + m!;
};

export const formatDuration = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

/** "£65", or "£92.50" when there are pence. */
export const formatPrice = (pounds: number): string => {
  const digits = Number.isInteger(pounds) ? 0 : 2;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(pounds);
};

/** A service's price as shown on menus: "£40", "from £70", or "Free". */
export const formatServicePrice = (service: Pick<Service, "price" | "priceFrom">): string =>
  service.price === 0 ? "Free" : `${service.priceFrom ? "from " : ""}${formatPrice(service.price)}`;

/**
 * Deposit taken online for these services, in pounds, rounded per service to the penny the same way the
 * booking API does. The API's figure on the booking is authoritative; this is for showing it up front.
 */
export const depositFor = (services: Service[]): number =>
  services.reduce((sum, s) => {
    if (!s.deposit) return sum;
    const pence = Math.round(s.price * 100);
    const due = "percent" in s.deposit ? Math.round((pence * s.deposit.percent) / 100) : Math.min(Math.round(s.deposit.amount * 100), pence);
    return sum + due;
  }, 0) / 100;

/**
 * The basket priced for a signed-in customer: a service one of their memberships covers uses a visit and costs
 * nothing (no deposit), as the booking API will do. Visits come from the membership ending soonest (no expiry
 * last), one per service. The API's figures on the booking are authoritative; this is for showing them up front.
 */
export function withMembershipVisits(services: readonly Service[], memberships: readonly MembershipSummary[] = []): PricedService[] {
  const usable = memberships
    .filter((m) => m.current)
    .sort((a, b) => (a.validTo ?? "\uffff").localeCompare(b.validTo ?? "\uffff") || a.validFrom.localeCompare(b.validFrom))
    .map((m) => ({ name: m.name, allowances: m.allowances.map((a) => ({ ...a })) }));
  return services.map((s) => {
    for (const m of usable) {
      const a = m.allowances.find((x) => x.left > 0 && x.offeringIds.includes(s.id));
      if (a) {
        a.left -= 1;
        const { deposit: _deposit, ...rest } = s;
        return { ...rest, price: 0, priceFrom: false, included: { membershipName: m.name, label: a.label } };
      }
    }
    return s;
  });
}

export const servicesById = (catalog: Catalog, ids: string[]): Service[] =>
  ids.map((id) => catalog.services.find((s) => s.id === id)).filter((s): s is Service => !!s);

export const totals = (services: Service[]) => ({
  durationMin: services.reduce((n, s) => n + s.durationMin, 0),
  price: services.reduce((n, s) => n + s.price, 0),
});

/** Stylists who offer every one of the given services (optionally restricted to one stylist). */
export const eligibleStylists = (catalog: Catalog, serviceIds: string[], stylistId: string | null = null): Stylist[] =>
  catalog.stylists.filter(
    (s) => (stylistId === null || s.id === stylistId) && serviceIds.every((id) => s.serviceIds.includes(id)),
  );
