import { useCallback, useEffect, useState } from "react";
import type { Catalog, ClockTime, ISODate } from "@salon/booking";

export const STEPS = ["professional", "services", "date", "time", "details"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  professional: "Professional",
  services: "Services",
  date: "Date",
  time: "Time",
  details: "Details",
};

export const STEP_TITLES: Record<Step, string> = {
  professional: "Select a professional",
  services: "Select services",
  date: "Select a date",
  time: "Select a time",
  details: "Your details",
};

/** Sentinel for "any professional". */
export const ANY = "any";

export interface Draft {
  /** `ANY`, a stylist id, or null when not chosen yet. */
  stylist: string | null;
  serviceIds: string[];
  date: ISODate | null;
  time: ClockTime | null;
}

const empty: Draft = { stylist: null, serviceIds: [], date: null, time: null };
const STORAGE_KEY = "cws:booking-draft";

export const isStep = (s: string | null): s is Step => !!s && (STEPS as readonly string[]).includes(s);

/** The furthest step the customer may be on, given what they've chosen so far. */
export function furthestStep(d: Draft): Step {
  if (!d.stylist) return "professional";
  if (!d.serviceIds.length) return "services";
  if (!d.date) return "date";
  if (!d.time) return "time";
  return "details";
}

export const stepIndex = (s: Step) => STEPS.indexOf(s);

export const stylistIdOrNull = (d: Draft) => (d.stylist && d.stylist !== ANY ? d.stylist : null);

function load(): Draft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<Draft>) } : empty;
  } catch {
    return empty;
  }
}

/** Booking draft + the transitions between steps. Persisted for the browser tab session. */
export function useDraft(catalog: Catalog | undefined) {
  const [draft, setDraft] = useState<Draft>(load);

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
        return {
          stylist,
          serviceIds: offered ? d.serviceIds.filter((id) => offered.includes(id)) : d.serviceIds,
          date: keepDate ? d.date : null,
          time: null,
        };
      }),
    [catalog],
  );

  const toggleService = useCallback(
    (id: string) =>
      setDraft((d) => ({
        ...d,
        serviceIds: d.serviceIds.includes(id) ? d.serviceIds.filter((s) => s !== id) : [...d.serviceIds, id],
        time: null,
      })),
    [],
  );

  const setDate = useCallback((date: ISODate) => setDraft((d) => ({ ...d, date, time: null })), []);
  const setTime = useCallback((time: ClockTime | null) => setDraft((d) => ({ ...d, time })), []);
  const reset = useCallback(() => setDraft(empty), []);

  return { draft, chooseStylist, toggleService, setDate, setTime, reset };
}
