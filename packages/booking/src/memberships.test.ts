import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import type { MembershipSummary } from "./types";
import { depositFor, servicesById, totals, withMembershipVisits } from "./utils";

const junior = (extra: Partial<MembershipSummary> = {}): MembershipSummary => ({
  id: "m1",
  name: "Junior membership",
  validFrom: "2026-11-01",
  validTo: "2027-01-31",
  current: true,
  allowances: [
    { label: "Full haircut", count: 3, left: 1, offeringIds: ["mens-cut"] },
    { label: "Back & sides", count: 2, left: 2, offeringIds: ["mens-graded"] },
  ],
  ...extra,
});

describe("withMembershipVisits", () => {
  it("makes a covered service free and leaves the rest at their price", () => {
    const priced = withMembershipVisits(servicesById(catalog, ["mens-cut", "beard-trim"]), [junior()]);
    expect(priced.map((s) => [s.id, s.price, s.included?.label])).toEqual([
      ["mens-cut", 0, "Full haircut"],
      ["beard-trim", 15, undefined],
    ]);
    expect(totals(priced).price).toBe(15);
  });

  it("takes no deposit on an included service", () => {
    const colour = junior({ allowances: [{ label: "Colour", count: 1, left: 1, offeringIds: ["root-colour"] }] });
    expect(depositFor(withMembershipVisits(servicesById(catalog, ["root-colour"]), [colour]))).toBe(0);
  });

  it("stops when the visits run out, and ignores memberships not in force", () => {
    expect(withMembershipVisits(servicesById(catalog, ["mens-cut", "mens-cut"]), [junior()]).map((s) => s.price)).toEqual([0, 40]);
    expect(withMembershipVisits(servicesById(catalog, ["mens-cut"]), [junior({ current: false })])[0]!.price).toBe(40);
    expect(withMembershipVisits(servicesById(catalog, ["mens-cut"]))[0]!.price).toBe(40);
  });
});
