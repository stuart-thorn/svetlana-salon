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

/** Offers the customer could claim for this visit: a service they chose is covered and starts in time. */
export function claimableOffers(catalog: Pick<Catalog, "offers">, services: readonly PricedService[], date: ISODate | null, time: ClockTime | null): Offer[] {
  if (!date || !time) return [];
  const at = starts(services, time);
  return (catalog.offers ?? []).filter((o) => o.claim && services.some((s, i) => !s.included && covers(o, s) && onTime(o, date, at[i]!)));
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
  const offers = (catalog.offers ?? []).filter((o) => !o.claim || claimed.includes(o.id));
  const at = starts(services, time);
  const totals = new Map<string, number>();
  services.forEach((s, i) => {
    if (s.included) return;
    let best: { id: string; amount: number } | undefined;
    for (const o of offers) {
      if (!covers(o, s) || !onTime(o, date, at[i]!)) continue;
      const amount = Math.min(s.price, o.percentOff !== undefined ? Math.round(s.price * o.percentOff) / 100 : (o.amountOff ?? 0));
      if (amount > 0 && amount > (best?.amount ?? 0)) best = { id: o.id, amount };
    }
    if (best) totals.set(best.id, (totals.get(best.id) ?? 0) + best.amount);
  });
  return offers.filter((o) => totals.has(o.id)).map((offer) => ({ offer, amount: Math.round(totals.get(offer.id)! * 100) / 100 }));
}
