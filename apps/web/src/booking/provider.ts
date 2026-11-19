import { createMockProvider, type BookingProvider } from "@salon/booking";

/**
 * The availability data source used by the booking flow.
 * Swap this for a real implementation of `BookingProvider` (REST API, booking platform, …)
 * without touching the UI, and set `isDemo` to false.
 */
export const provider: BookingProvider = createMockProvider();

/** Shows a "demo mode" banner in the booking flow while availability is simulated. */
export const isDemo = true;
