import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { claimableOffers, offerSavings, partyOfferSavings } from "./offers";
import { fitsPerson, personLabel, servicesFor, toggleService } from "./party";
import { toCatalog, toPartyConfirmation } from "./rest";
import type { Offer, PricedService } from "./types";

const family: Offer = { id: "family-visit", name: "Family Visit", percentOff: 15, serviceIds: ["mens-cut", "womens-cut", "toddler-cut", "boys-cut"], minPeople: 3 };
const cut = (id: string, price: number): PricedService => ({ id, categoryId: "c", name: id, durationMin: 30, price });

describe("people in a group booking", () => {
  it("are offered what suits their menu and age", () => {
    const toddler = catalog.services.find((s) => s.id === "toddler-cut")!;
    expect(fitsPerson(toddler, { audienceId: "children", age: 1 })).toBe(true); // may be 18 months
    expect(fitsPerson(toddler, { audienceId: "children", age: 0 })).toBe(false);
    expect(fitsPerson(toddler, { audienceId: "children", age: 5 })).toBe(false);
    expect(fitsPerson(toddler, { audienceId: "men" })).toBe(false);
    // A 3-year-old: only the toddler cut; at 4 they may also have the boys' or girls' cut.
    expect(servicesFor(catalog, { audienceId: "children", age: 3 }).map((s) => s.id)).toEqual(["toddler-cut"]);
    expect(servicesFor(catalog, { audienceId: "children", age: 4 }).map((s) => s.id)).toEqual(["boys-cut", "girls-cut", "toddler-cut"]);
    const forChild = servicesFor(catalog, { audienceId: "children", age: 8 }).map((s) => s.id);
    expect(forChild).toContain("boys-cut");
    expect(forChild).not.toContain("toddler-cut");
    expect(forChild.some((id) => /colour|highlights|balayage/.test(id))).toBe(false);
  });

  it("build one visit each, and are named or numbered", () => {
    expect(toggleService(catalog, [], "mens-cut")).toEqual(["mens-cut"]);
    expect(toggleService(catalog, ["mens-cut"], "skin-fade")).toEqual(["skin-fade"]); // two cuts: starts again
    expect(toggleService(catalog, ["mens-cut"], "mens-cut")).toEqual([]);
    expect(personLabel({ name: " Mia ", age: 3 }, 2)).toBe("Mia (3)");
    expect(personLabel({}, 1)).toBe("Person 2");
  });
});

describe("group offers", () => {
  it("apply when enough people have a covered service, before and after a time is chosen", () => {
    const three = [{ services: [cut("mens-cut", 40)], time: null }, { services: [cut("womens-cut", 70)], time: null }, { services: [cut("toddler-cut", 30)], time: null }];
    const { savings, priced } = partyOfferSavings({ offers: [family] }, three, null);
    expect(savings).toEqual([{ offer: family, amount: 21 }]);
    expect(priced.flat().map((s) => s.price)).toEqual([34, 59.5, 25.5]);
    expect(partyOfferSavings({ offers: [family] }, three.slice(0, 2), null).savings).toEqual([]);
  });

  it("are the only offers on a group: offers for one person don't apply", () => {
    const anyone: Offer = { id: "spring", name: "Spring", percentOff: 50 };
    const three = [{ services: [cut("mens-cut", 40)], time: "10:00" }, { services: [cut("womens-cut", 70)], time: "10:00" }, { services: [cut("toddler-cut", 30)], time: "10:00" }];
    expect(partyOfferSavings({ offers: [family, anyone] }, three, "2026-12-02").savings.map((s) => s.offer.id)).toEqual(["family-visit"]);
  });

  it("aren't offered on one person's visit", () => {
    expect(claimableOffers({ offers: [{ ...family, claim: { label: "x", check: "y" } }] }, [cut("mens-cut", 40)], "2026-11-25", "10:00")).toEqual([]);
    expect(offerSavings({ offers: [family] }, [cut("mens-cut", 40)], "2026-11-25", "10:00", [])).toEqual([]);
  });

  it("come from the booking system's minAttendees", () => {
    const api = {
      tenant: { name: "N&G", policies: { payment: { kind: "none" as const } } },
      locations: [{ id: "cw", kind: "physical" }],
      categories: [],
      audiences: [{ id: "children", name: "Children", askAge: true }],
      offerings: [{ id: "toddler-cut", categoryId: "c", name: "Toddler", durationMin: 30, basePrice: { amount: 3000, currency: "GBP" }, ages: { min: 1.5, max: 4 } }],
      providers: [],
      skills: [],
      promotions: [{ id: "family-visit", name: "Family Visit", discount: { kind: "percent" as const, percent: 15 }, scope: { kind: "all" as const }, conditions: { minAttendees: 3 } }],
    };
    const c = toCatalog(api, "cw");
    expect(c.offers).toEqual([expect.objectContaining({ id: "family-visit", minPeople: 3 })]);
    expect(c.audiences[0]!.askAge).toBe(true);
    expect(c.services[0]!.ages).toEqual({ min: 1.5, max: 4 });
  });
});

describe("group booking confirmation", () => {
  it("places each person as the chosen time showed", () => {
    const money = (amount: number) => ({ amount, currency: "GBP" });
    const confirmation = toPartyConfirmation(
      {
        id: "bk_1",
        reference: "NGC-1",
        status: "pending_payment",
        providerId: "tom",
        items: [
          { offeringId: "mens-cut", attendee: { ref: "p1" } },
          { offeringId: "toddler-cut", attendee: { ref: "p2" } },
        ],
        date: "2026-12-02",
        time: "10:00",
        endTime: "10:30",
        durationMin: 30,
        total: money(7000),
        depositDue: money(3500),
        balanceDue: money(3500),
        amountPaid: money(0),
      },
      {
        party: [
          { ref: "p1", audienceId: "men", serviceIds: ["mens-cut"], stylistId: null },
          { ref: "p2", audienceId: "children", age: 3, name: "Mia", serviceIds: ["toddler-cut"], stylistId: "svetlana" },
        ],
        date: "2026-12-02",
        slot: { time: "10:00", assignments: [{ ref: "p1", stylistId: "tom", time: "10:00", endTime: "10:30" }, { ref: "p2", stylistId: "svetlana", time: "10:00", endTime: "10:30" }] },
        customer: { name: "Pat", email: "pat@example.com", phone: "07700900000" },
      },
    );
    expect(confirmation.people).toEqual([
      { ref: "p1", audienceId: "men", serviceIds: ["mens-cut"], stylistId: "tom", time: "10:00", endTime: "10:30" },
      { ref: "p2", audienceId: "children", age: 3, name: "Mia", serviceIds: ["toddler-cut"], stylistId: "svetlana", time: "10:00", endTime: "10:30" },
    ]);
  });
});
