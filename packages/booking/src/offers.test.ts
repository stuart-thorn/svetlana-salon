import { describe, expect, it } from "vitest";
import { claimableOffers, offerSavings } from "./offers";
import type { Offer, PricedService } from "./types";

const student: Offer = {
  id: "student",
  name: "Student offer",
  percentOff: 10,
  serviceIds: ["mens-cut"],
  days: [1, 2, 3, 4, 5],
  times: { start: "14:00", end: "17:00" },
  claim: { label: "I'm a student", check: "Show a valid student ID" },
};
const cut: PricedService = { id: "mens-cut", categoryId: "men", name: "Men's cut", durationMin: 30, price: 40 };
const beard: PricedService = { id: "beard", categoryId: "men", name: "Beard trim", durationMin: 15, price: 15 };
const catalog = { offers: [student] };
// 2026-11-25 is a Wednesday; 2026-11-28 a Saturday.

describe("offers on the booking site", () => {
  it("can be claimed when a covered service starts in the window on one of its days", () => {
    expect(claimableOffers(catalog, [cut], "2026-11-25", "14:00")).toEqual([student]);
    expect(claimableOffers(catalog, [cut], "2026-11-25", "17:00")).toEqual([]);
    expect(claimableOffers(catalog, [cut], "2026-11-28", "15:00")).toEqual([]);
    expect(claimableOffers(catalog, [beard], "2026-11-25", "15:00")).toEqual([]);
    expect(claimableOffers(catalog, [{ ...cut, included: { membershipName: "Junior", label: "Full haircut" } }], "2026-11-25", "15:00")).toEqual([]);
  });

  it("saves only when claimed, on each covered service by its own start", () => {
    expect(offerSavings(catalog, [cut], "2026-11-25", "15:00", [])).toEqual([]);
    expect(offerSavings(catalog, [cut], "2026-11-25", "15:00", ["student"])).toEqual([{ offer: student, amount: 4 }]);
    // The beard trim first: the cut starts at 17:00, outside the window.
    expect(offerSavings(catalog, [{ ...beard, durationMin: 15 }, cut], "2026-11-25", "16:45", ["student"])).toEqual([]);
  });
});
