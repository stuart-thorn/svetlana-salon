import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { canAdd, prune, resolveVisit } from "./visit";

describe("resolveVisit (N&G menu)", () => {
  it("accepts single services", () => {
    for (const s of catalog.services) expect(resolveVisit(catalog, [s.id])).toEqual([s.id]);
  });

  it("rejects services for different people", () => {
    expect(resolveVisit(catalog, ["mens-cut", "womens-cut"])).toBeNull();
    expect(resolveVisit(catalog, ["kids-cut", "highlights"])).toBeNull();
  });

  it("rejects two cuts, two colours, or two unrelated mains", () => {
    expect(resolveVisit(catalog, ["skin-fade", "mens-graded"])).toBeNull();
    expect(resolveVisit(catalog, ["full-colour", "womens-cut", "womens-hair-design"])).toBeNull();
    expect(resolveVisit(catalog, ["root-colour", "highlights"])).toBeNull();
    expect(resolveVisit(catalog, ["womens-cut", "blow-dry"])).toBeNull();
    expect(resolveVisit(catalog, ["colour-consultation", "full-colour"])).toBeNull();
  });

  it("puts the main first and add-ons after, in menu order", () => {
    expect(resolveVisit(catalog, ["womens-cut", "full-colour"])).toEqual(["full-colour", "womens-cut"]);
    expect(resolveVisit(catalog, ["blow-dry", "womens-cut", "balayage"])).toEqual(["balayage", "womens-cut", "blow-dry"]);
    expect(resolveVisit(catalog, ["beard-trim", "root-colour", "skin-fade"])).toEqual(["root-colour", "skin-fade", "beard-trim"]);
    expect(resolveVisit(catalog, ["beard-trim", "mens-cut"])).toEqual(["mens-cut", "beard-trim"]);
  });
});

describe("canAdd / prune", () => {
  it("offers add-ons that fit the current visit", () => {
    const fits = (ids: string[]) => catalog.services.filter((s) => canAdd(catalog, ids, s.id)).map((s) => s.id);
    expect(fits(["mens-cut"])).toEqual(["beard-trim", "root-colour", "full-colour", "t-section", "half-highlights", "highlights", "balayage"]);
    expect(fits(["womens-cut"])).toEqual(["root-colour", "full-colour", "t-section", "half-highlights", "highlights", "balayage"]);
    expect(fits(["full-colour"])).toContain("blow-dry");
    expect(fits(["full-colour"])).not.toContain("root-colour");
    expect(fits(["kids-cut"])).toEqual([]);
  });

  it("keeps the earliest main and what still hangs off it", () => {
    expect(prune(catalog, ["full-colour", "womens-cut"])).toEqual(["full-colour", "womens-cut"]);
    expect(prune(catalog, ["womens-cut", "blow-dry"])).toEqual(["womens-cut"]);
    expect(prune(catalog, ["mens-cut", "beard-trim"])).toEqual(["mens-cut", "beard-trim"]);
    expect(prune(catalog, ["blow-dry", "womens-cut"])).toEqual(["blow-dry"]);
    expect(prune(catalog, [])).toEqual([]);
  });
});
