import type { Catalog, Service } from "./types";

/**
 * One person's visit: a main service plus add-ons that hang off it (colour → cut → beard trim).
 * Mirrors bookable-agent's `resolveVisit` (packages/domain/src/visit.ts), which the booking API enforces:
 * keep the two in step.
 */

/** True when `addOn` can join a visit that includes `target`. */
export function isAddOnTo(addOn: Service, target: Service): boolean {
  const ref = addOn.addOnTo;
  if (!ref || addOn.id === target.id) return false;
  return !!(ref.offeringIds?.includes(target.id) || ref.categoryIds?.includes(target.categoryId));
}

const lookup = (catalog: Catalog, ids: readonly string[]) =>
  ids.map((id) => catalog.services.find((s) => s.id === id)).filter((s): s is Service => !!s);

/** The add-ons reachable from `root` within `services`, depth-first in menu order, root first. */
function treeFrom(catalog: Catalog, root: Service, services: readonly Service[]): Service[] {
  const menuIndex = (s: Service) => catalog.services.indexOf(s);
  const out: Service[] = [];
  const placed = new Set<string>();
  const visit = (node: Service) => {
    out.push(node);
    placed.add(node.id);
    for (const child of services.filter((s) => !placed.has(s.id) && isAddOnTo(s, node)).sort((a, b) => menuIndex(a) - menuIndex(b))) {
      if (!placed.has(child.id)) visit(child);
    }
  };
  visit(root);
  return out;
}

/**
 * The service IDs in the order they're performed (main first, then add-ons), or `null` when they don't make
 * one person's visit: different audiences, not exactly one main, or two from one exclusive group.
 */
export function resolveVisit(catalog: Catalog, ids: readonly string[]): string[] | null {
  const services = lookup(catalog, ids);
  if (services.length === 0 || services.length !== ids.length) return null;

  let shared: Set<string> | undefined;
  for (const s of services) {
    if (!s.audienceIds) continue;
    shared = new Set(shared ? s.audienceIds.filter((a) => shared!.has(a)) : s.audienceIds);
  }
  if (shared && shared.size === 0) return null;

  const groups = services.map((s) => s.exclusiveGroup).filter(Boolean);
  if (new Set(groups).size !== groups.length) return null;

  const roots = services.filter((s) => !services.some((t) => isAddOnTo(s, t)));
  if (roots.length !== 1 || roots[0]!.standalone === false) return null;

  const ordered = treeFrom(catalog, roots[0]!, services);
  return ordered.length === services.length ? ordered.map((s) => s.id) : null;
}

/** Whether adding `id` to the selection still makes one visit. */
export const canAdd = (catalog: Catalog, selectedIds: readonly string[], id: string): boolean =>
  !selectedIds.includes(id) && resolveVisit(catalog, [...selectedIds, id]) !== null;

/**
 * After a service is removed: the largest visit left, keeping the earliest-chosen main and the add-ons that
 * still hang off it. E.g. removing the colour from colour + cut + blow-dry leaves the cut.
 */
export function prune(catalog: Catalog, selectedIds: readonly string[]): string[] {
  if (selectedIds.length === 0 || resolveVisit(catalog, selectedIds)) return [...selectedIds];
  const services = lookup(catalog, selectedIds);
  for (const root of services) {
    if (root.standalone === false) continue;
    const ids = treeFrom(catalog, root, services).map((s) => s.id);
    // Drop add-ons that clash (same group) until the rest is a valid visit.
    while (ids.length > 1 && !resolveVisit(catalog, ids)) ids.pop();
    if (resolveVisit(catalog, ids)) return selectedIds.filter((id) => ids.includes(id));
  }
  return [];
}
