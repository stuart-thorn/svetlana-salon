import { useCallback, useEffect, useState } from "react";
import { canAdd, eligibleStylists, prune, resolveVisit, type Catalog, type ClockTime, type ISODate } from "@salon/booking";

export const STEPS = ["audience", "professional", "services", "date", "time", "details"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  audience: "Menu",
  professional: "Professional",
  services: "Services",
  date: "Date",
  time: "Time",
  details: "Details",
};

/** Headings per step. The business can set its own for `audience` (`Catalog.audiencesPrompt`). */
export const STEP_TITLES: Record<Step, string> = {
  audience: "Who's the appointment for?",
  professional: "Select a professional",
  services: "Select services",
  date: "Select a date",
  time: "Select a time",
  details: "Your details",
};

/** Sentinel for "any professional". */
export const ANY = "any";

/** "Family or group" choice for booking several people. Not in the catalogue: party bookings aren't supported yet. */
export const FAMILY = "family";

export interface Draft {
  /** `ANY`, a stylist id, or null when not chosen yet. */
  stylist: string | null;
  /** Audience the menu is filtered to (`FAMILY`, an audience id, or null when not chosen yet). */
  audience: string | null;
  /** One person's visit, kept in the order performed: main first, then add-ons. */
  serviceIds: string[];
  date: ISODate | null;
  time: ClockTime | null;
}

const empty: Draft = { stylist: null, audience: null, serviceIds: [], date: null, time: null };
const STORAGE_KEY = "cws:booking-draft";

export const isStep = (s: string | null): s is Step => !!s && (STEPS as readonly string[]).includes(s);

/**
 * The furthest step the customer may be on, given what they've chosen so far. `needsAudience` is false when the
 * catalogue defines no audiences, so there's nothing to ask.
 */
export function furthestStep(d: Draft, needsAudience = true): Step {
  if (needsAudience && (!d.audience || d.audience === FAMILY)) return "audience";
  if (!d.stylist) return "professional";
  if (!d.serviceIds.length) return "services";
  if (!d.date) return "date";
  if (!d.time) return "time";
  return "details";
}

export const stepIndex = (s: Step) => STEPS.indexOf(s);

export const stylistIdOrNull = (d: Pick<Draft, "stylist">) => (d.stylist && d.stylist !== ANY ? d.stylist : null);

function load(): Draft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<Draft>) } : empty;
  } catch {
    return empty;
  }
}

/** Whether a service is offered to the audience (null = no audience chosen or none defined: everything). */
export const forAudience = (audience: string | null, s: { audienceIds?: string[] }) =>
  !audience || audience === FAMILY || !s.audienceIds || s.audienceIds.includes(audience);

/** Whether a stylist (or `ANY`) offers anything to the audience. */
export const servesAudience = (catalog: Catalog, stylist: string, audience: string | null) =>
  stylist === ANY ||
  catalog.services.some(
    (s) => forAudience(audience, s) && !!catalog.stylists.find((st) => st.id === stylist)?.serviceIds.includes(s.id),
  );

/** The largest valid visit left in `ids`, in the order performed. */
const tidy = (catalog: Catalog, ids: string[]) => {
  const kept = prune(catalog, ids);
  return resolveVisit(catalog, kept) ?? kept;
};

/** Whether `id` can join the selection: a valid visit, and someone (the chosen stylist, or anyone) does it all. */
export const fitsVisit = (catalog: Catalog, d: Pick<Draft, "stylist" | "serviceIds">, id: string) =>
  canAdd(catalog, d.serviceIds, id) && eligibleStylists(catalog, [...d.serviceIds, id], stylistIdOrNull(d)).length > 0;

/** Booking draft + the transitions between steps. Persisted for the browser tab session. */
export function useDraft(catalog: Catalog | undefined) {
  const [draft, setDraft] = useState<Draft>(load);

  // A draft saved before the menu changed (or before visit rules existed) may no longer make one visit.
  useEffect(() => {
    if (!catalog) return;
    setDraft((d) => {
      const ids = tidy(catalog, d.serviceIds);
      return ids.join() === d.serviceIds.join() ? d : { ...d, serviceIds: ids, time: null };
    });
  }, [catalog]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable: draft just won't survive a reload */
    }
  }, [draft]);

  const chooseStylist = useCallback(
    (stylist: string, { keepDate = false } = {}) =>
      setDraft((d) => {
        if (d.stylist === stylist) return d;
        const offered = catalog?.stylists.find((s) => s.id === stylist)?.serviceIds;
        const serviceIds = offered ? d.serviceIds.filter((id) => offered.includes(id)) : d.serviceIds;
        return {
          ...d,
          stylist,
          serviceIds: catalog ? tidy(catalog, serviceIds) : serviceIds,
          date: keepDate ? d.date : null,
          time: null,
        };
      }),
    [catalog],
  );

  /**
   * Changing who it's for keeps only the chosen services offered to them, and drops a professional who
   * doesn't serve them.
   */
  const chooseAudience = useCallback(
    (audience: string) =>
      setDraft((d) => {
        if (d.audience === audience) return d;
        if (!catalog || audience === FAMILY) return { ...d, audience };
        const stylist = d.stylist && servesAudience(catalog, d.stylist, audience) ? d.stylist : null;
        const serviceIds = tidy(
          catalog,
          d.serviceIds.filter((id) => forAudience(audience, catalog.services.find((s) => s.id === id) ?? {})),
        );
        const unchanged = stylist === d.stylist && serviceIds.join() === d.serviceIds.join();
        return unchanged ? { ...d, audience } : { audience, stylist, serviceIds, date: stylist ? d.date : null, time: null };
      }),
    [catalog],
  );

  /**
   * Tap a service: a chosen one is removed (with any add-ons that hung off it); one that fits the visit is
   * added; anything else starts a new visit with just that service, like choosing another radio option.
   */
  const selectService = useCallback(
    (id: string) =>
      setDraft((d) => {
        if (!catalog) return d;
        const ids = d.serviceIds.includes(id)
          ? d.serviceIds.filter((s) => s !== id)
          : fitsVisit(catalog, d, id)
            ? [...d.serviceIds, id]
            : [id];
        return { ...d, serviceIds: tidy(catalog, ids), time: null };
      }),
    [catalog],
  );

  const setDate = useCallback((date: ISODate) => setDraft((d) => ({ ...d, date, time: null })), []);
  const setTime = useCallback((time: ClockTime | null) => setDraft((d) => ({ ...d, time })), []);
  const reset = useCallback(() => setDraft(empty), []);

  return { draft, chooseStylist, chooseAudience, selectService, setDate, setTime, reset };
}
