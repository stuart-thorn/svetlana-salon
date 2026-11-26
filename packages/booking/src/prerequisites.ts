import type { NeedsFirst, RequirementRecord } from "./types";

/**
 * Where a customer stands on what a service needs first (the booking API decides; this only explains it):
 * - `met`: one of their records counts already (`via` names it)
 * - `met_from`: it counts for visits from `from` on, `hours` after the record's `at`: colour 24 hours after a
 *   patch test done today (`at` past) or booked for tomorrow (`at` to come)
 * - `unmet`: nothing on record, or not signed in (`records` undefined), when records can't count
 */
export type NeedsFirstStatus = { kind: "met"; via: string } | { kind: "met_from"; via: string; at: Date; hours: number; from: Date } | { kind: "unmet" };

export function needsFirstStatus(needs: NeedsFirst, records: RequirementRecord[] | undefined, now: Date = new Date()): NeedsFirstStatus {
  const today = now.toISOString().slice(0, 10);
  let soonest: { via: string; at: Date; hours: number; from: Date } | undefined;
  for (const option of needs.options) {
    for (const r of records ?? []) {
      if (r.requirementId !== option.requirementId || (r.validUntil && r.validUntil < today)) continue;
      const at = new Date(r.at);
      const hours = option.minHoursBefore ?? 0;
      const from = new Date(at.getTime() + hours * 3_600_000);
      if (from <= now) return { kind: "met", via: option.name };
      if (!soonest || from < soonest.from) soonest = { via: option.name, at, hours, from };
    }
  }
  return soonest ? { kind: "met_from", ...soonest } : { kind: "unmet" };
}
