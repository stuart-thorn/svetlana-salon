import { describe, expect, it } from "vitest";
import { formatAtSalon, formatLinePrice, formatServicePrice, formatTotal } from "./utils";

const cut = { price: 40 };
const colour = { price: 70, priceFrom: true };
const toddler = { price: 10, priceAgreed: true };

describe("prices agreed in the salon", () => {
  it("shows the deposit and that the price is agreed in the salon", () => {
    expect(formatServicePrice(toddler)).toBe("£10 deposit · price agreed in the salon");
    expect(formatServicePrice(cut)).toBe("£40");
    expect(formatServicePrice(colour)).toBe("from £70");
    expect(formatLinePrice(toddler)).toBe("£10 deposit");
    expect(formatLinePrice(colour)).toBe("from £70");
  });

  it("leaves what's paid for an agreed price out of the total, since it counts towards that price", () => {
    expect(formatTotal(10, [toddler])).toBe("Agreed in salon");
    expect(formatTotal(50, [cut, toddler])).toBe("£40 + agreed price");
    expect(formatTotal(110, [cut, colour])).toBe("from £110");
    // A visit included in a membership isn't an agreed price to pay.
    expect(formatTotal(0, [{ ...toddler, included: { membershipName: "Club", label: "Cut" } }])).toBe("£0");
  });

  it("says the rest of the agreed price is paid in the salon", () => {
    expect(formatAtSalon(0, [toddler])).toBe("Rest of agreed price");
    expect(formatAtSalon(20, [cut, toddler])).toBe("£20 + rest of agreed price");
    expect(formatAtSalon(35, [colour])).toBe("from £35");
  });
});
