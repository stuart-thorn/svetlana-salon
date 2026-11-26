import { describe, expect, it } from "vitest";
import { needsFirstStatus } from "./prerequisites";
import type { NeedsFirst } from "./types";

const colour: NeedsFirst = {
  options: [
    { requirementId: "patch-test", name: "Patch test", minHoursBefore: 24 },
    { requirementId: "colour-waiver", name: "Colour waiver" },
  ],
  bookServiceIds: ["colour-consultation"],
};
const now = new Date("2026-11-26T12:00:00Z");

describe("needsFirstStatus", () => {
  it("is unmet when not signed in or with nothing on record", () => {
    expect(needsFirstStatus(colour, undefined, now)).toEqual({ kind: "unmet" });
    expect(needsFirstStatus(colour, [], now)).toEqual({ kind: "unmet" });
  });

  it("is met by a waiver, or a patch test at least 24 hours ago", () => {
    expect(needsFirstStatus(colour, [{ requirementId: "colour-waiver", at: "2026-11-26T11:00:00Z" }], now)).toEqual({ kind: "met", via: "Colour waiver" });
    expect(needsFirstStatus(colour, [{ requirementId: "patch-test", at: "2026-11-25T10:00:00Z" }], now)).toEqual({ kind: "met", via: "Patch test" });
  });

  it("counts a recent or booked patch test from 24 hours after it", () => {
    expect(needsFirstStatus(colour, [{ requirementId: "patch-test", at: "2026-11-27T10:00:00Z" }], now)).toEqual({
      kind: "met_from",
      via: "Patch test",
      at: new Date("2026-11-27T10:00:00Z"),
      hours: 24,
      from: new Date("2026-11-28T10:00:00Z"),
    });
  });

  it("ignores expired records and other requirements", () => {
    expect(needsFirstStatus(colour, [{ requirementId: "patch-test", at: "2025-01-01T10:00:00Z", validUntil: "2025-07-01" }], now)).toEqual({ kind: "unmet" });
    expect(needsFirstStatus(colour, [{ requirementId: "other", at: "2025-01-01T10:00:00Z" }], now)).toEqual({ kind: "unmet" });
  });
});
