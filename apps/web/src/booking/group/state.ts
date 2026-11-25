import { useCallback, useEffect, useState } from "react";
import { MAX_PARTY, fitsPerson, toggleService, type Catalog, type ISODate, type PartyMember, type PartySlot } from "@salon/booking";

export const GROUP_STEPS = ["people", "services", "date", "time", "details"] as const;
export type GroupStep = (typeof GROUP_STEPS)[number];

export const GROUP_STEP_LABELS: Record<GroupStep, string> = {
  people: "Who's coming",
  services: "Services",
  date: "Date",
  time: "Time",
  details: "Details",
};

export const GROUP_STEP_TITLES: Record<GroupStep, string> = {
  people: "Who's coming?",
  services: "Choose each person's services",
  date: "Select a date",
  time: "Select a time",
  details: "Your details",
};

/** Fewest people a group booking is for (one person books the usual way). */
export const MIN_PARTY = 2;

export interface GroupDraft {
  people: PartyMember[];
  date: ISODate | null;
  /** The start time chosen, with who is with whom. */
  slot: PartySlot | null;
}

const empty: GroupDraft = { people: [], date: null, slot: null };
const STORAGE_KEY = "cws:group-draft";

export const isGroupStep = (s: string | null): s is GroupStep => !!s && (GROUP_STEPS as readonly string[]).includes(s);
export const groupStepIndex = (s: GroupStep) => GROUP_STEPS.indexOf(s);

/** Everyone whose menu asks for an age has one. */
const agesGiven = (catalog: Catalog | undefined, people: readonly PartyMember[]) =>
  people.every((p) => p.age !== undefined || !catalog?.audiences.find((a) => a.id === p.audienceId)?.askAge);

/** The furthest step the customer may be on, given what they've chosen so far. */
export function furthestGroupStep(d: GroupDraft, catalog: Catalog | undefined): GroupStep {
  if (d.people.length < MIN_PARTY || d.people.length > MAX_PARTY || !agesGiven(catalog, d.people)) return "people";
  if (d.people.some((p) => p.serviceIds.length === 0)) return "services";
  if (!d.date) return "date";
  if (!d.slot) return "time";
  return "details";
}

function load(): GroupDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<GroupDraft>) } : empty;
  } catch {
    return empty;
  }
}

/** A group booking's draft and the changes to it. Anything that changes the visit clears the chosen time. */
export function useGroupDraft(catalog: Catalog | undefined) {
  const [draft, setDraft] = useState<GroupDraft>(load);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable: the draft just won't survive a reload */
    }
  }, [draft]);

  /** A person's details changed: services that no longer suit them (a new age) are dropped. */
  const update = useCallback(
    (ref: string, change: Partial<Omit<PartyMember, "ref">>) =>
      setDraft((d) => ({
        ...d,
        slot: null,
        people: d.people.map((p) => {
          if (p.ref !== ref) return p;
          const next = { ...p, ...change };
          const serviceIds = catalog ? next.serviceIds.filter((id) => fitsPerson(catalog.services.find((s) => s.id === id) ?? {}, next)) : next.serviceIds;
          return { ...next, serviceIds };
        }),
      })),
    [catalog],
  );

  const add = useCallback(
    (audienceId: string) =>
      setDraft((d) => {
        if (d.people.length >= MAX_PARTY) return d;
        const n = Math.max(0, ...d.people.map((p) => Number(p.ref.slice(1)) || 0)) + 1;
        return { ...d, slot: null, people: [...d.people, { ref: `p${n}`, audienceId, serviceIds: [], stylistId: null }] };
      }),
    [],
  );

  /** Removes the last person added from that menu. */
  const removeFrom = useCallback(
    (audienceId: string) =>
      setDraft((d) => {
        const last = d.people.map((p) => p.audienceId).lastIndexOf(audienceId);
        return last < 0 ? d : { ...d, slot: null, people: d.people.filter((_, i) => i !== last) };
      }),
    [],
  );

  const toggle = useCallback(
    (ref: string, serviceId: string) =>
      setDraft((d) =>
        catalog
          ? {
              ...d,
              slot: null,
              people: d.people.map((p) => {
                if (p.ref !== ref) return p;
                const serviceIds = toggleService(catalog, p.serviceIds, serviceId);
                // A professional who doesn't do the new services goes back to "anyone".
                const keeps = p.stylistId && catalog.stylists.find((s) => s.id === p.stylistId)?.serviceIds;
                return { ...p, serviceIds, stylistId: keeps && serviceIds.every((id) => keeps.includes(id)) ? p.stylistId : null };
              }),
            }
          : d,
      ),
    [catalog],
  );

  const setDate = useCallback((date: ISODate) => setDraft((d) => ({ ...d, date, slot: null })), []);
  const setSlot = useCallback((slot: PartySlot | null) => setDraft((d) => ({ ...d, slot })), []);
  const reset = useCallback(() => setDraft(empty), []);

  return { draft, update, add, removeFrom, toggle, setDate, setSlot, reset };
}
