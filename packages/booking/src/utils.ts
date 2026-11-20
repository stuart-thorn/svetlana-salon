import type { Catalog, ClockTime, ISODate, Service, Stylist } from "./types";

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
