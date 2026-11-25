import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";
import { createMockProvider } from "./mock";
import { BookingExpiredError, IncompatibleServicesError, SlotUnavailableError } from "./types";
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
    const duration = catalog.services.find((s) => s.id === "balayage")!.durationMin;
    for (const s of slots) {
      const start = timeToMinutes(s.time);
      expect(start + duration).toBeLessThanOrEqual(close);
      expect(busy.some((b) => b.start < start + duration && start < b.end)).toBe(false);
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
    // Every online booking takes a 50% deposit; the slot is held meanwhile.
    expect(conf.status).toBe("pending_payment");
    expect(conf.deposit).toMatchObject({ now: 35, atSalon: 35, paid: false });

    const after = await p.getTimeSlots(query);
    expect(after.find((s) => s.time === first!.time)).toBeUndefined();
    await expect(
      p.createBooking({ ...query, time: first!.time, customer: { name: "B", email: "b@b.co", phone: "07000000000" } }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("refuses services that don't make one visit, and books add-ons after the main", async () => {
    const p = make();
    const date = nextWeekday(addDays(TODAY, 1), 1);
    await expect(p.getTimeSlots({ date, stylistId: "aisha", serviceIds: ["mens-cut", "womens-cut"] })).rejects.toBeInstanceOf(IncompatibleServicesError);
    await expect(p.getAvailableDates({ from: date, to: date, stylistId: null, serviceIds: ["skin-fade", "mens-graded"] })).rejects.toBeInstanceOf(IncompatibleServicesError);

    let query = { date, stylistId: "elena", serviceIds: ["womens-cut", "full-colour"] };
    let [slot] = await p.getTimeSlots(query);
    for (let n = 1; !slot && n < 14; n++) [slot] = await p.getTimeSlots((query = { ...query, date: addDays(date, n) }));
    const conf = await p.createBooking({ ...query, time: slot!.time, customer: { name: "V", email: "v@v.co", phone: "07000000000" } });
    expect(conf.serviceIds).toEqual(["full-colour", "womens-cut"]);
    expect(conf.durationMin).toBe(135);
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
    expect(pending).toMatchObject({ status: "pending_payment", total: 180, deposit: { now: 90, atSalon: 90, paid: false } });
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

describe("mock group bookings", () => {
  const family = [
    { ref: "p1", audienceId: "men", serviceIds: ["mens-cut"], stylistId: null },
    { ref: "p2", audienceId: "women", serviceIds: ["womens-cut"], stylistId: null },
    { ref: "p3", audienceId: "children", age: 3, name: "Mia", serviceIds: ["toddler-cut"], stylistId: null },
  ];

  it("starts everyone together with different stylists, the toddler with Svetlana", async () => {
    const p = make();
    const date = nextWeekday(addDays(TODAY, 1), 3);
    const days = await p.getPartyDates({ party: family, from: date, to: addDays(date, 6) });
    const open = days.find((d) => d.status === "available")!;
    const slots = await p.getPartyTimes({ party: family, date: open.date });
    expect(slots.length).toBeGreaterThan(0);
    const slot = slots[0]!;
    expect(new Set(slot.assignments.map((a) => a.stylistId)).size).toBe(3);
    expect(slot.assignments.every((a) => a.time === slot.time)).toBe(true);
    expect(slot.assignments.find((a) => a.ref === "p3")!.stylistId).toBe("svetlana");
    // Weekends: Svetlana doesn't work.
    const sat = nextWeekday(addDays(TODAY, 1), 6);
    expect(await p.getPartyTimes({ party: family, date: sat })).toEqual([]);
  });

  it("puts people with the same stylist one after the other, and books and confirms them all", async () => {
    const p = make();
    const date = nextWeekday(addDays(TODAY, 1), 3);
    const pair = [
      { ...family[1]!, stylistId: "svetlana" },
      { ...family[2]!, stylistId: "svetlana" },
    ];
    const slots = await p.getPartyTimes({ party: pair, date });
    const slot = slots[0]!;
    expect(slot.assignments[1]!.time).toBe(slot.assignments[0]!.endTime);
    const party3 = [family[0]!, ...pair];
    const slot3 = (await p.getPartyTimes({ party: party3, date }))[0]!;
    const booked = await p.createPartyBooking({ party: party3, date, slot: slot3, customer: { name: "Pat", email: "pat@example.com", phone: "07700900000" } });
    // £40 + £70 + £30 less 15% Family Visit is £119; half as a deposit.
    expect(booked).toMatchObject({ total: 119, status: "pending_payment", deposit: { now: 59.5 } });
    expect(booked.people!.map((x) => x.stylistId)).toEqual(slot3.assignments.map((a) => a.stylistId));
    expect((await p.getPartyTimes({ party: party3, date })).some((s) => s.time === slot3.time)).toBe(false);
    await expect(p.completeSimulatedPayment(booked)).resolves.toMatchObject({ status: "confirmed" });
    await expect(p.createPartyBooking({ party: party3, date, slot: slot3, customer: { name: "Al", email: "al@example.com", phone: "07700900001" } })).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("refuses services that don't suit someone", async () => {
    const p = make();
    const date = nextWeekday(addDays(TODAY, 1), 3);
    await expect(p.getPartyTimes({ party: [{ ref: "c", audienceId: "children", age: 8, serviceIds: ["toddler-cut"], stylistId: null }], date })).rejects.toBeInstanceOf(IncompatibleServicesError);
  });
});
