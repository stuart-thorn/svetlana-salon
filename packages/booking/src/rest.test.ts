import { describe, expect, it } from "vitest";
import { createRestProvider } from "./rest";
import { depositFor } from "./utils";
import { BookingExpiredError, IncompatibleServicesError, SlotUnavailableError } from "./types";

const gbp = (amount: number) => ({ amount, currency: "GBP" });

function fakeApi(routes: Record<string, { status?: number; body: unknown }>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const key = `${init?.method ?? "GET"} ${new URL(url).pathname}`;
    const route = routes[key];
    if (!route) throw new Error(`Unexpected ${key}`);
    return new Response(JSON.stringify(route.body), { status: route.status ?? 200 });
  }) as typeof globalThis.fetch;
  const provider = createRestProvider({ baseUrl: "http://api.test/v1/", apiKey: "pk_test_x", locationId: "cw", fetch });
  return { provider, calls };
}

const booking = (extra: Record<string, unknown> = {}) => ({
  id: "bk_1",
  reference: "CWS-ABC123",
  status: "confirmed",
  providerId: "elena",
  items: [{ offeringId: "womens-cut" }],
  date: "2026-11-25",
  time: "10:00",
  endTime: "11:00",
  durationMin: 60,
  total: gbp(6500),
  depositDue: gbp(0),
  balanceDue: gbp(6500),
  amountPaid: gbp(0),
  ...extra,
});

describe("REST provider", () => {
  it("maps the catalogue: pence to pounds, skills to stylist services, HH:mm hours to minutes", async () => {
    const { provider, calls } = fakeApi({
      "GET /v1/catalog": {
        body: {
          tenant: { name: "Canary Wharf Salon", policies: { payment: { kind: "none" } }, audiencesPrompt: "Who's it for?" },
          locations: [{ id: "cw", kind: "physical", openingHours: [{ open: "10:00", close: "16:00" }, null, null, null, null, null, null] }],
          categories: [
            { id: "cut", name: "Cut & Style" },
            { id: "colour", name: "Colour", policyOverrides: { payment: { kind: "deposit", percent: 50 } } },
          ],
          offerings: [
            { id: "womens-cut", categoryId: "cut", name: "Women's cut", durationMin: 60, basePrice: gbp(6500) },
            { id: "toner", categoryId: "colour", name: "Toner", durationMin: 30, basePrice: gbp(3333), audienceIds: ["women"], standalone: false, addOnTo: { categoryIds: ["cut"] }, exclusiveGroup: "toner" },
            { id: "consult", categoryId: "colour", name: "Consultation", durationMin: 15, basePrice: gbp(0), policyOverrides: { payment: { kind: "none" } } },
          ],
          audiences: [{ id: "women", name: "Women's hair", description: "Cuts and colour", sortOrder: 1 }],
          providers: [{ id: "elena", name: "Elena", title: "Senior Stylist" }],
          skills: [{ providerId: "elena", offeringId: "womens-cut", price: gbp(6500), durationMin: 60 }],
        },
      },
    });
    const catalog = await provider.getCatalog();
    expect(catalog.audiences).toEqual([{ id: "women", name: "Women's hair", description: "Cuts and colour" }]);
    expect(catalog.services[1]).toMatchObject({ audienceIds: ["women"], standalone: false, addOnTo: { categoryIds: ["cut"] }, exclusiveGroup: "toner" });
    expect(catalog.services[0]).not.toHaveProperty("standalone");
    expect(calls[0]!.url).toBe("http://api.test/v1/catalog?locationId=cw");
    expect((calls[0]!.init?.headers as Record<string, string>)["X-Api-Key"]).toBe("pk_test_x");
    expect(catalog.salonName).toBe("Canary Wharf Salon");
    expect(catalog.audiencesPrompt).toBe("Who's it for?");
    expect(catalog.services[0]).toMatchObject({ id: "womens-cut", price: 65, durationMin: 60 });
    expect(catalog.services.map((s) => s.deposit)).toEqual([undefined, { percent: 50 }, undefined]);
    // Rounded per service like the API: 50% of £33.33 = £16.67.
    expect(depositFor(catalog.services)).toBe(16.67);
    expect(catalog.stylists[0]).toMatchObject({ id: "elena", role: "Senior Stylist", serviceIds: ["womens-cut"] });
    expect(catalog.openingHours[0]).toEqual({ open: 600, close: 960 });
    expect(catalog.openingHours[1]).toBeNull();
  });

  it("keeps the API's catalogue order and maps 'from' prices", async () => {
    const { provider } = fakeApi({
      "GET /v1/catalog": {
        body: {
          tenant: { name: "N&G Canary Wharf", policies: { payment: { kind: "none" } } },
          locations: [],
          categories: [{ id: "women", name: "Women" }, { id: "men", name: "Men" }],
          offerings: [
            { id: "womens-cut", categoryId: "women", name: "Women's cut & finish", durationMin: 60, basePrice: gbp(7000), priceFrom: true },
            { id: "mens-cut", categoryId: "men", name: "Men's standard cut", durationMin: 45, basePrice: gbp(4000) },
          ],
          providers: [{ id: "tom", name: "Tom" }, { id: "aisha", name: "Aisha" }],
          skills: [],
        },
      },
    });
    const catalog = await provider.getCatalog();
    expect(catalog.categories.map((c) => c.id)).toEqual(["women", "men"]);
    expect(catalog.stylists.map((s) => s.id)).toEqual(["tom", "aisha"]);
    expect(catalog.services[0]).toMatchObject({ id: "womens-cut", price: 70, priceFrom: true });
    expect(catalog.services[1]!.priceFrom).toBeUndefined();
  });

  it("queries availability and maps providerIds to stylistIds", async () => {
    const { provider, calls } = fakeApi({
      "GET /v1/availability/slots": { body: [{ time: "09:00", providerIds: ["elena", "marco"] }] },
      "GET /v1/availability/dates": { body: [{ date: "2026-11-25", status: "available" }] },
    });
    expect(await provider.getTimeSlots({ date: "2026-11-25", stylistId: null, serviceIds: ["a", "b"] })).toEqual([
      { time: "09:00", stylistIds: ["elena", "marco"] },
    ]);
    expect(calls[0]!.url).toBe("http://api.test/v1/availability/slots?locationId=cw&offeringIds=a%2Cb&date=2026-11-25");
    await provider.getAvailableDates({ from: "2026-11-01", to: "2026-11-30", stylistId: "elena", serviceIds: ["a"] });
    expect(calls[1]!.url).toContain("providerId=elena");
  });

  it("creates a booking with an idempotency key and maps a deposit", async () => {
    const { provider, calls } = fakeApi({
      "POST /v1/bookings": {
        status: 201,
        body: booking({ status: "pending_payment", depositDue: gbp(9250), balanceDue: gbp(9250), total: gbp(18500), expiresAt: "2026-11-20T10:10:00Z" }),
      },
    });
    const c = await provider.createBooking({
      stylistId: null,
      serviceIds: ["balayage"],
      date: "2026-11-25",
      time: "13:00",
      customer: { name: "Ana", email: "ana@example.com", phone: "07700900000" },
    });
    expect(c).toMatchObject({ bookingId: "bk_1", status: "pending_payment", total: 185, deposit: { now: 92.5, atSalon: 92.5, paid: false } });
    const sent = JSON.parse(calls[0]!.init!.body as string);
    expect(sent).toMatchObject({ locationId: "cw", providerId: null, offeringIds: ["balayage"] });
    expect((calls[0]!.init?.headers as Record<string, string>)["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reuses the Idempotency-Key when the same booking is retried, and not for a different one", async () => {
    const { provider, calls } = fakeApi({ "POST /v1/bookings": { status: 201, body: booking() } });
    const request = { stylistId: "elena", serviceIds: ["womens-cut"], date: "2026-11-25", time: "10:00", customer: { name: "A", email: "a@b.c", phone: "" } };
    await provider.createBooking(request);
    await provider.createBooking(request);
    await provider.createBooking({ ...request, time: "11:00" });
    const keys = calls.map((c) => (c.init?.headers as Record<string, string>)["Idempotency-Key"]);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it("turns API problems into the SPA's errors", async () => {
    const taken = fakeApi({ "POST /v1/bookings": { status: 409, body: { code: "slot_unavailable" } } });
    await expect(
      taken.provider.createBooking({ stylistId: "elena", serviceIds: ["a"], date: "2026-11-25", time: "10:00", customer: { name: "A", email: "a@b.c", phone: "" } }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);
    const expired = fakeApi({ "POST /v1/bookings/bk_1/simulate-payment": { status: 409, body: { code: "booking_expired" } } });
    const pending = { reference: "CWS-ABC123", bookingId: "bk_1", stylistId: "elena", serviceIds: [], date: "2026-11-25", time: "10:00", endTime: "11:00", durationMin: 60, total: 65 };
    await expect(expired.provider.completeSimulatedPayment(pending)).rejects.toBeInstanceOf(BookingExpiredError);
    const mixed = fakeApi({ "GET /v1/availability/slots": { status: 422, body: { code: "incompatible_offerings", detail: "Book each person separately." } } });
    await expect(mixed.provider.getTimeSlots({ date: "2026-11-25", stylistId: null, serviceIds: ["a", "b"] })).rejects.toThrow(IncompatibleServicesError);
    const inFlight = fakeApi({ "POST /v1/bookings": { status: 409, body: { code: "idempotency_conflict" } } });
    await expect(
      inFlight.provider.createBooking({ stylistId: "elena", serviceIds: ["a"], date: "2026-11-25", time: "10:00", customer: { name: "A", email: "a@b.c", phone: "" } }),
    ).rejects.toThrow(/still processing/);
  });
});
