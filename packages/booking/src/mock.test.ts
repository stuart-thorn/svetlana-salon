import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { createMockProvider } from "./mock";
import { SlotUnavailableError } from "./types";
import { addDays, dayOfWeek, timeToMinutes } from "./utils";

// Tuesday 24 Nov 2026, 08:00 local.
const NOW = new Date(2026, 10, 24, 8, 0);
const TODAY = "2026-11-24";
const make = () => createMockProvider({ latencyMs: [0, 0], now: () => NOW });

const nextWeekday = (from: string, dow: number) => {
  let d = from;
  while (dayOfWeek(d) !== dow) d = addDays(d, 1);
  return d;
};

describe("mock booking provider", () => {
  it("returns no slots on Mondays (closed)", async () => {
    const p = make();
    const monday = nextWeekday(TODAY, 1);
    expect(await p.getTimeSlots({ date: monday, stylistId: null, serviceIds: ["womens-cut"] })).toEqual([]);
  });

  it("returns no slots for a stylist who does not offer the service", async () => {
    const p = make();
    expect(await p.getTimeSlots({ date: TODAY, stylistId: "tom", serviceIds: ["balayage"] })).toEqual([]);
  });

  it("returns no slots on a stylist's day off", async () => {
    const p = make();
    const sunday = nextWeekday(TODAY, 0); // Elena does not work Sundays
    expect(await p.getTimeSlots({ date: sunday, stylistId: "elena", serviceIds: ["womens-cut"] })).toEqual([]);
  });

  it("only offers slots that finish by closing time and avoid busy periods", async () => {
    const p = make();
    const date = addDays(TODAY, 1);
    const slots = await p.getTimeSlots({ date, stylistId: "elena", serviceIds: ["balayage"] });
    const close = catalog.openingHours[dayOfWeek(date)]!.close;
    const busy = p.busyIntervals("elena", date);
    for (const s of slots) {
      const start = timeToMinutes(s.time);
      expect(start + 180).toBeLessThanOrEqual(close);
      expect(busy.some((b) => b.start < start + 180 && start < b.end)).toBe(false);
    }
  });

  it("'any professional' slots are the union of eligible stylists' slots", async () => {
    const p = make();
    const date = addDays(TODAY, 2);
    const serviceIds = ["blow-dry"];
    const any = await p.getTimeSlots({ date, stylistId: null, serviceIds });
    const eligible = catalog.stylists.filter((s) => s.serviceIds.includes("blow-dry"));
    const union = new Set<string>();
    for (const s of eligible) {
      for (const slot of await p.getTimeSlots({ date, stylistId: s.id, serviceIds })) union.add(slot.time);
    }
    expect(new Set(any.map((s) => s.time))).toEqual(union);
  });

  it("respects lead time for same-day bookings", async () => {
    const p = createMockProvider({ latencyMs: [0, 0], now: () => new Date(2026, 10, 24, 14, 5) });
    const slots = await p.getTimeSlots({ date: TODAY, stylistId: null, serviceIds: ["mens-cut"] });
    for (const s of slots) expect(timeToMinutes(s.time)).toBeGreaterThanOrEqual(15 * 60 + 15);
  });

  it("marks closed, past and out-of-window days as closed", async () => {
    const p = make();
    const days = await p.getAvailableDates({ from: addDays(TODAY, -2), to: addDays(TODAY, 70), stylistId: null, serviceIds: ["mens-cut"] });
    for (const d of days) {
      if (d.date < TODAY || d.date > addDays(TODAY, 60) || dayOfWeek(d.date) === 1) expect(d.status).toBe("closed");
    }
    expect(days.some((d) => d.status === "available")).toBe(true);
  });

  it("marks a stylist's days off as closed rather than fully booked", async () => {
    const p = make();
    const days = await p.getAvailableDates({ from: TODAY, to: addDays(TODAY, 13), stylistId: "elena", serviceIds: ["womens-cut"] });
    for (const d of days.filter((d) => dayOfWeek(d.date) === 0)) expect(d.status).toBe("closed");
  });

  it("books a slot, removes it from availability and rejects double booking", async () => {
    const p = make();
    const date = addDays(TODAY, 1);
    const query = { date, stylistId: "elena", serviceIds: ["womens-cut"] };
    const [first] = await p.getTimeSlots(query);
    expect(first).toBeDefined();

    const conf = await p.createBooking({ ...query, time: first!.time, customer: { name: "A", email: "a@b.co", phone: "07000000000" } });
    expect(conf.stylistId).toBe("elena");
    expect(conf.durationMin).toBe(60);
    expect(conf.total).toBe(65);

    const after = await p.getTimeSlots(query);
    expect(after.find((s) => s.time === first!.time)).toBeUndefined();
    await expect(
      p.createBooking({ ...query, time: first!.time, customer: { name: "B", email: "b@b.co", phone: "07000000000" } }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("assigns a free stylist when booking with 'any professional'", async () => {
    const p = make();
    const date = addDays(TODAY, 3);
    const [slot] = await p.getTimeSlots({ date, stylistId: null, serviceIds: ["mens-cut"] });
    const conf = await p.createBooking({ date, time: slot!.time, stylistId: null, serviceIds: ["mens-cut"], customer: { name: "C", email: "c@c.co", phone: "07000000000" } });
    expect(slot!.stylistIds).toContain(conf.stylistId);
  });
});
