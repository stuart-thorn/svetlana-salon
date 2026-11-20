import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { createMockProvider } from "./mock";
import { BookingExpiredError, SlotUnavailableError } from "./types";
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
  it("is open 7 days: 08:00–19:00 on weekdays, 10:00–18:00 at weekends", async () => {
    const p = make();
    for (const [dow, open, close] of [[1, 8, 19], [0, 10, 18]] as const) {
      // Look across three weeks: the simulated diary fully books the odd day.
      const first = nextWeekday(addDays(TODAY, 1), dow);
      const slots = (
        await Promise.all([0, 7, 14].map((n) => p.getTimeSlots({ date: addDays(first, n), stylistId: null, serviceIds: ["blow-dry"] })))
      ).flat();
      expect(slots.length).toBeGreaterThan(0);
      for (const s of slots) {
        expect(timeToMinutes(s.time)).toBeGreaterThanOrEqual(open * 60);
        expect(timeToMinutes(s.time) + 45).toBeLessThanOrEqual(close * 60);
      }
    }
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
      if (d.date < TODAY || d.date > addDays(TODAY, 60)) expect(d.status).toBe("closed");
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
    expect(conf.total).toBe(70);
    expect(conf.status).toBe("confirmed");
    expect(conf.deposit).toBeUndefined();

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

  it("holds a colour booking until its 50% deposit is paid", async () => {
    const p = make();
    const date = addDays(TODAY, 1);
    const query = { date, stylistId: "marco", serviceIds: ["balayage"] };
    const [slot] = await p.getTimeSlots(query);
    const pending = await p.createBooking({ ...query, time: slot!.time, customer: { name: "D", email: "d@d.co", phone: "07000000000" } });
    expect(pending).toMatchObject({ status: "pending_payment", total: 150, deposit: { now: 75, atSalon: 75, paid: false } });
    expect(pending.expiresAt).toBeDefined();
    expect((await p.getTimeSlots(query)).find((s) => s.time === slot!.time)).toBeUndefined();

    const paid = await p.completeSimulatedPayment(pending);
    expect(paid).toMatchObject({ status: "confirmed", deposit: { paid: true } });
    expect(paid.expiresAt).toBeUndefined();
  });

  it("releases the slot when the deposit hold runs out", async () => {
    let clock = NOW.getTime();
    const p = createMockProvider({ latencyMs: [0, 0], now: () => new Date(clock), holdMin: 10 });
    const date = addDays(TODAY, 1);
    const query = { date, stylistId: "marco", serviceIds: ["root-colour"] };
    const [slot] = await p.getTimeSlots(query);
    const pending = await p.createBooking({ ...query, time: slot!.time, customer: { name: "E", email: "e@e.co", phone: "07000000000" } });

    clock += 11 * 60_000;
    expect((await p.getTimeSlots(query)).map((s) => s.time)).toContain(slot!.time);
    await expect(p.completeSimulatedPayment(pending)).rejects.toBeInstanceOf(BookingExpiredError);
  });
});
