import { catalog as defaultCatalog } from "./catalog";
import {
  BookingExpiredError,
  IncompatibleServicesError,
  SlotUnavailableError,
  type AvailabilityQuery,
  type BookingConfirmation,
  type BookingProvider,
  type BookingRequest,
  type Catalog,
  type DayAvailability,
  type ISODate,
  type TimeSlot,
} from "./types";
import {
  addDays,
  dayOfWeek,
  depositFor,
  eligibleStylists,
  minutesToTime,
  servicesById,
  timeToMinutes,
  toISODate,
  totals,
} from "./utils";
import { resolveVisit } from "./visit";

export interface MockProviderOptions {
  catalog?: Catalog;
  /** Slot granularity in minutes. */
  slotStepMin?: number;
  /** Minimum notice for same-day bookings. */
  leadTimeMin?: number;
  /** How far ahead bookings are accepted. */
  maxDaysAhead?: number;
  /** Simulated network latency [min, max] in ms. Use [0, 0] in tests. */
  latencyMs?: [number, number];
  /** Clock, injectable for tests. */
  now?: () => Date;
  /** Changes the generated "existing bookings". */
  seed?: string;
  /** How long a slot is held while a deposit is paid. */
  holdMin?: number;
}

interface Interval {
  start: number;
  end: number;
  /** Set while a deposit is unpaid: the slot frees up after this instant (ms). */
  heldUntil?: number;
  bookingId?: string;
}

// Small deterministic PRNG so the fake diary is stable across reloads.
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const mulberry32 = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/**
 * In-memory availability source. Generates a plausible, deterministic diary of
 * existing appointments per stylist per day, and records bookings made in-session.
 */
export function createMockProvider(options: MockProviderOptions = {}): BookingProvider &
  Required<Pick<BookingProvider, "completeSimulatedPayment">> & {
  /** Exposed for tests/debugging. */
  busyIntervals(stylistId: string, date: ISODate): Interval[];
} {
  const {
    catalog = defaultCatalog,
    slotStepMin = 15,
    leadTimeMin = 60,
    maxDaysAhead = 60,
    latencyMs = [200, 450],
    now = () => new Date(),
    seed = "canary-wharf",
    holdMin = 10,
  } = options;

  const booked = new Map<string, Interval[]>();
  const key = (stylistId: string, date: ISODate) => `${stylistId}|${date}`;

  const delay = <T>(value: () => T): Promise<T> => {
    const [min, max] = latencyMs;
    const ms = min + Math.random() * (max - min);
    return new Promise((resolve, reject) => {
      const run = () => {
        try {
          resolve(value());
        } catch (e) {
          reject(e);
        }
      };
      if (ms <= 0) queueMicrotask(run);
      else setTimeout(run, ms);
    });
  };

  const hoursFor = (date: ISODate) => catalog.openingHours[dayOfWeek(date)] ?? null;

  const generatedBusy = (stylistId: string, date: ISODate): Interval[] => {
    const hours = hoursFor(date);
    if (!hours) return [];
    const rand = mulberry32(hash(`${seed}|${stylistId}|${date}`));
    // ~8% of days are already fully booked.
    if (rand() < 0.08) return [{ start: hours.open, end: hours.close }];
    const blocks: Interval[] = [];
    const count = 1 + Math.floor(rand() * 4);
    const lengths = [30, 45, 60, 90, 120];
    for (let i = 0; i < count; i++) {
      const len = lengths[Math.floor(rand() * lengths.length)]!;
      const steps = Math.floor((hours.close - hours.open - len) / slotStepMin);
      if (steps <= 0) continue;
      const start = hours.open + slotStepMin * Math.floor(rand() * (steps + 1));
      blocks.push({ start, end: start + len });
    }
    return blocks;
  };

  const busyIntervals = (stylistId: string, date: ISODate) => [
    ...generatedBusy(stylistId, date),
    ...(booked.get(key(stylistId, date)) ?? []).filter((b) => b.heldUntil === undefined || b.heldUntil > now().getTime()),
  ];

  const bookableWindow = () => {
    const today = toISODate(now());
    return { today, last: addDays(today, maxDaysAhead) };
  };

  /** Like the booking API: the services must make one person's visit; returns them in the order performed. */
  const visitOf = (serviceIds: string[]): string[] => {
    const ordered = resolveVisit(catalog, serviceIds);
    if (!ordered) throw new IncompatibleServicesError();
    return ordered;
  };

  const computeSlots = ({ stylistId, serviceIds, date }: AvailabilityQuery & { date: ISODate }): TimeSlot[] => {
    const hours = hoursFor(date);
    const { today, last } = bookableWindow();
    if (!hours || serviceIds.length === 0 || date < today || date > last) return [];

    const { durationMin } = totals(servicesById(catalog, serviceIds));
    const weekday = dayOfWeek(date);
    const stylists = eligibleStylists(catalog, serviceIds, stylistId).filter((s) => s.workingDays.includes(weekday));
    if (stylists.length === 0) return [];

    let earliest = hours.open;
    if (date === today) {
      const n = now();
      const minNow = n.getHours() * 60 + n.getMinutes() + leadTimeMin;
      earliest = Math.max(earliest, Math.ceil(minNow / slotStepMin) * slotStepMin);
    }

    const slots: TimeSlot[] = [];
    for (let start = earliest; start + durationMin <= hours.close; start += slotStepMin) {
      const appt = { start, end: start + durationMin };
      const free = stylists.filter((s) => !busyIntervals(s.id, date).some((b) => overlaps(b, appt))).map((s) => s.id);
      if (free.length) slots.push({ time: minutesToTime(start), stylistIds: free });
    }
    return slots;
  };

  return {
    busyIntervals,

    getCatalog: () => delay(() => catalog),

    getAvailableDates: ({ from, to, ...query }) =>
      delay(() => {
        visitOf(query.serviceIds);
        const days: DayAvailability[] = [];
        // Cap the range to keep a bad query from spinning.
        for (let d = from, i = 0; d <= to && i < 120; d = addDays(d, 1), i++) {
          const { today, last } = bookableWindow();
          const nobodyWorking = !eligibleStylists(catalog, query.serviceIds, query.stylistId).some((s) =>
            s.workingDays.includes(dayOfWeek(d)),
          );
          if (!hoursFor(d) || d < today || d > last || nobodyWorking) days.push({ date: d, status: "closed" });
          else days.push({ date: d, status: computeSlots({ ...query, date: d }).length ? "available" : "fully-booked" });
        }
        return days;
      }),

    getTimeSlots: (query) =>
      delay(() => {
        visitOf(query.serviceIds);
        return computeSlots(query);
      }),

    createBooking: (request: BookingRequest) =>
      delay((): BookingConfirmation => {
        const serviceIds = visitOf(request.serviceIds);
        const slot = computeSlots(request).find((s) => s.time === request.time);
        if (!slot) throw new SlotUnavailableError();
        const stylistId = request.stylistId ?? slot.stylistIds[0]!;
        if (!slot.stylistIds.includes(stylistId)) throw new SlotUnavailableError();

        const services = servicesById(catalog, serviceIds);
        const { durationMin, price } = totals(services);
        const depositNow = depositFor(services);
        const start = timeToMinutes(request.time);
        const bookingId = `bk_mock_${Math.random().toString(36).slice(2, 10)}`;
        const heldUntil = depositNow > 0 ? now().getTime() + holdMin * 60_000 : undefined;
        const k = key(stylistId, request.date);
        booked.set(k, [...(booked.get(k) ?? []), { start, end: start + durationMin, bookingId, ...(heldUntil && { heldUntil }) }]);

        return {
          reference: `NGC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          bookingId,
          stylistId,
          serviceIds,
          date: request.date,
          time: request.time,
          endTime: minutesToTime(start + durationMin),
          durationMin,
          total: price,
          ...(heldUntil
            ? {
                status: "pending_payment" as const,
                deposit: { now: depositNow, atSalon: price - depositNow, paid: false },
                expiresAt: new Date(heldUntil).toISOString(),
              }
            : { status: "confirmed" as const }),
        };
      }),

    completeSimulatedPayment: (c) =>
      delay((): BookingConfirmation => {
        const k = key(c.stylistId, c.date);
        const entry = (booked.get(k) ?? []).find((b) => b.bookingId === c.bookingId);
        if (!entry || !c.deposit) throw new Error("Unknown booking");
        if (entry.heldUntil !== undefined && entry.heldUntil <= now().getTime()) {
          booked.set(k, (booked.get(k) ?? []).filter((b) => b !== entry));
          throw new BookingExpiredError();
        }
        delete entry.heldUntil;
        const { expiresAt: _expired, ...rest } = c;
        return { ...rest, status: "confirmed", deposit: { ...c.deposit, paid: true } };
      }),
  };
}
