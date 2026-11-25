import type { Catalog, ClockTime, ISODate, Offer, PricedService } from "./types";
import { minutesToTime, timeToMinutes } from "./utils";

const dayOf = (date: ISODate) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Whether an offer covers a service (its services or categories; neither = all). */
const covers = (offer: Offer, s: Pick<PricedService, "id" | "categoryId">) =>
  offer.serviceIds ? offer.serviceIds.includes(s.id) : offer.categoryIds ? offer.categoryIds.includes(s.categoryId) : true;

/** Whether a service starting then is on the offer's days and in its times (start included, end not). */
const onTime = (offer: Offer, date: ISODate, time: ClockTime) => {
  if (offer.days?.length && !offer.days.includes(dayOf(date))) return false;
  if (!offer.times) return true;
  const m = timeToMinutes(time);
  return m >= timeToMinutes(offer.times.start) && m < timeToMinutes(offer.times.end);
};

/** Each service's start: one after another from the visit's start. */
function starts(services: readonly PricedService[], time: ClockTime): ClockTime[] {
  let m = timeToMinutes(time);
  return services.map((s) => {
    const at = minutesToTime(m);
    m += s.durationMin;
    return at;
  });
}

/** Offers for one person's visit: those for several people (`minPeople`) are for party bookings. */
const single = (catalog: Pick<Catalog, "offers">) => (catalog.offers ?? []).filter((o) => !o.minPeople);

/** Offers the customer could claim for this visit: a service they chose is covered and starts in time. */
export function claimableOffers(catalog: Pick<Catalog, "offers">, services: readonly PricedService[], date: ISODate | null, time: ClockTime | null): Offer[] {
  if (!date || !time) return [];
  const at = starts(services, time);
  return single(catalog).filter((o) => o.claim && services.some((s, i) => !s.included && covers(o, s) && onTime(o, date, at[i]!)));
}

/** Offers to claim that cover a service they chose, but not on the chosen day or at the chosen time. */
export function offersAtOtherTimes(catalog: Pick<Catalog, "offers">, services: readonly PricedService[], date: ISODate | null, time: ClockTime | null): Offer[] {
  if (!date || !time) return [];
  const now = claimableOffers(catalog, services, date, time);
  return single(catalog).filter((o) => o.claim && !now.includes(o) && services.some((s) => !s.included && covers(o, s)));
}

/** Per service, the largest reduction from the offers that apply, in pounds (none on ones included in a membership). */
function reductions(
  offers: readonly Offer[],
  services: readonly PricedService[],
  date: ISODate,
  time: ClockTime,
): ({ id: string; amount: number } | undefined)[] {
  const at = starts(services, time);
  return services.map((s, i) => {
    if (s.included) return undefined;
    let best: { id: string; amount: number } | undefined;
    for (const o of offers) {
      if (!covers(o, s) || !onTime(o, date, at[i]!)) continue;
      const amount = Math.min(s.price, o.percentOff !== undefined ? Math.round(s.price * o.percentOff) / 100 : (o.amountOff ?? 0));
      if (amount > 0 && amount > (best?.amount ?? 0)) best = { id: o.id, amount };
    }
    return best;
  });
}

const applying = (catalog: Pick<Catalog, "offers">, claimed: readonly string[]) =>
  single(catalog).filter((o) => !o.claim || claimed.includes(o.id));

/**
 * A party's savings: offers for several people (`minPeople`) when enough people have a service they cover, each
 * person's services from their own start. A group isn't combined with memberships or offers for one person.
 * Until the day and times are known, only offers that apply on any day at any time count.
 * Returns the savings per offer and each person's services at their prices after offers, in pounds.
 */
export function partyOfferSavings(
  catalog: Pick<Catalog, "offers">,
  people: readonly { services: readonly PricedService[]; time: ClockTime | null }[],
  date: ISODate | null,
): { savings: { offer: Offer; amount: number }[]; priced: PricedService[][] } {
  // Before a day and time are chosen, only offers for any day and time can be counted.
  const known = !!date && people.every((p) => p.time);
  const all = (catalog.offers ?? []).filter((o) => known || (!o.days?.length && !o.times));
  const groupOffers = all.filter(
    (o) => !o.claim && o.minPeople && people.filter((p) => p.services.some((s) => !s.included && covers(o, s))).length >= o.minPeople,
  );
  // A group is priced as a group: its own offers only, never combined with offers for one person.
  const offers = groupOffers;
  const totals = new Map<string, number>();
  const priced = people.map((p) => {
    const by = reductions(offers, p.services, date ?? "2000-01-01", p.time ?? "00:00");
    for (const r of by) if (r) totals.set(r.id, (totals.get(r.id) ?? 0) + r.amount);
    return p.services.map((s, i) => (by[i] ? { ...s, price: Math.round((s.price - by[i].amount) * 100) / 100 } : s));
  });
  return {
    savings: offers.filter((o) => totals.has(o.id)).map((offer) => ({ offer, amount: Math.round(totals.get(offer.id)! * 100) / 100 })),
    priced,
  };
}

/**
 * What the visit saves with the offers that apply (unclaimed ones by themselves, claimed ones when ticked): one
 * reduction per service, the largest, and none on services included in a membership. In pounds, per offer.
 */
export function offerSavings(
  catalog: Pick<Catalog, "offers">,
  services: readonly PricedService[],
  date: ISODate | null,
  time: ClockTime | null,
  claimed: readonly string[],
): { offer: Offer; amount: number }[] {
  if (!date || !time) return [];
  const offers = applying(catalog, claimed);
  const totals = new Map<string, number>();
  for (const r of reductions(offers, services, date, time)) if (r) totals.set(r.id, (totals.get(r.id) ?? 0) + r.amount);
  return offers.filter((o) => totals.has(o.id)).map((offer) => ({ offer, amount: Math.round(totals.get(offer.id)! * 100) / 100 }));
}

/** The services at their prices after the offers that apply: what the deposit is worked out on. */
export function withOfferPrices(
  catalog: Pick<Catalog, "offers">,
  services: readonly PricedService[],
  date: ISODate | null,
  time: ClockTime | null,
  claimed: readonly string[],
): PricedService[] {
  if (!date || !time) return [...services];
  const by = reductions(applying(catalog, claimed), services, date, time);
  return services.map((s, i) => (by[i] ? { ...s, price: Math.round((s.price - by[i].amount) * 100) / 100 } : s));
}
