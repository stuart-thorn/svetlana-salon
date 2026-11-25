import type { Catalog, Person, Service } from "./types";
import { eligibleStylists } from "./utils";
import { canAdd, prune, resolveVisit } from "./visit";

/** Most people one booking can be for (the booking system's limit). */
export const MAX_PARTY = 6;

/**
 * Whether a service suits this person: offered to their audience and, when both are known, their age. An age N
 * in whole years covers [N, N+1), so a 1-year-old may already be 18 months.
 */
export function fitsPerson(service: Pick<Service, "audienceIds" | "ages">, person: Pick<Person, "audienceId" | "age">): boolean {
  if (service.audienceIds && !service.audienceIds.includes(person.audienceId)) return false;
  const { age } = person;
  if (age !== undefined && service.ages) {
    if (service.ages.min !== undefined && age + 1 <= service.ages.min) return false;
    if (service.ages.max !== undefined && age > service.ages.max) return false;
  }
  return true;
}

/** The services a person can choose from, in menu order. */
export const servicesFor = (catalog: Catalog, person: Pick<Person, "audienceId" | "age">): Service[] =>
  catalog.services.filter((s) => fitsPerson(s, person));

/**
 * Tap a service for one person: a chosen one is removed (with add-ons hanging off it), one that fits their visit
 * (and someone does it all) is added, anything else starts their visit again with it. In the order performed.
 */
export function toggleService(catalog: Catalog, selected: readonly string[], id: string): string[] {
  const fits = canAdd(catalog, selected, id) && eligibleStylists(catalog, [...selected, id]).length > 0;
  const ids = selected.includes(id) ? selected.filter((s) => s !== id) : fits ? [...selected, id] : [id];
  const kept = prune(catalog, ids);
  return resolveVisit(catalog, kept) ?? kept;
}

/** What to call a person: their name, else "Person n", with an age when known: "Mia (3)". */
export function personLabel(person: Pick<Person, "name" | "age">, index: number): string {
  const name = person.name?.trim() || `Person ${index + 1}`;
  return person.age !== undefined ? `${name} (${person.age})` : name;
}
