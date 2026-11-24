import { createCustomerAuth, createMockProvider, createRestProvider, type BookingProvider, type CustomerAuth } from "@salon/booking";

/**
 * The availability data source used by the booking flow.
 * With VITE_BOOKING_API_URL set it talks to the Bookable API; otherwise it uses the in-memory mock.
 * See apps/web/.env.example.
 */
const apiUrl = import.meta.env.VITE_BOOKING_API_URL as string | undefined;
const apiKey = (import.meta.env.VITE_BOOKING_API_KEY as string | undefined) ?? "";
const locationId = (import.meta.env.VITE_BOOKING_LOCATION_ID as string | undefined) ?? "";

const customerPoolClientId = import.meta.env.VITE_CUSTOMER_POOL_CLIENT_ID as string | undefined;

/**
 * Customer sign-in (email code), when the booking API is real and a customer pool is configured. Off in demo
 * mode: there's no one to look up.
 */
export const customerAuth: CustomerAuth | undefined =
  apiUrl && customerPoolClientId ? createCustomerAuth({ clientId: customerPoolClientId }) : undefined;

export const provider: BookingProvider = apiUrl
  ? createRestProvider({ baseUrl: apiUrl, apiKey, locationId, customerToken: () => customerAuth?.session()?.idToken })
  : createMockProvider();

/** Shows a "demo mode" banner while availability is simulated. */
export const isDemo = !apiUrl;
