import { createMockProvider, createRestProvider, type BookingProvider } from "@salon/booking";

/**
 * The availability data source used by the booking flow.
 * With VITE_BOOKING_API_URL set it talks to the Bookable API; otherwise it uses the in-memory mock.
 * See apps/web/.env.example.
 */
const apiUrl = import.meta.env.VITE_BOOKING_API_URL as string | undefined;
const apiKey = (import.meta.env.VITE_BOOKING_API_KEY as string | undefined) ?? "";
const locationId = (import.meta.env.VITE_BOOKING_LOCATION_ID as string | undefined) ?? "";

export const provider: BookingProvider = apiUrl
  ? createRestProvider({ baseUrl: apiUrl, apiKey, locationId })
  : createMockProvider();

/** Shows a "demo mode" banner while availability is simulated. */
export const isDemo = !apiUrl;

/** Real availability, but test-mode payments (pk_test_ key): shows a "test mode" banner. */
export const isTestMode = !!apiUrl && apiKey.startsWith("pk_test_");
