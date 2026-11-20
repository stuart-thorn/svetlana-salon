/** ISO calendar date in salon local time, e.g. "2026-11-24". */
export type ISODate = string;
/** Wall-clock time in salon local time, e.g. "09:15". */
export type ClockTime = string;

export interface Category {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  durationMin: number;
  /** Price in whole pounds (GBP). With `priceFrom`, the starting price. */
  price: number;
  /** Shown as "from £X": the final price depends on hair length, stylist or consultation. */
  priceFrom?: boolean;
  /** Part of the price paid online when booking: a percentage, or a fixed amount in pounds. Absent = none. */
  deposit?: { percent: number } | { amount: number };
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  serviceIds: string[];
  /** Days of week worked, 0 = Sunday … 6 = Saturday. */
  workingDays: number[];
}

export interface OpeningHours {
  /** Minutes from midnight. */
  open: number;
  close: number;
}

export interface Catalog {
  salonName: string;
  categories: Category[];
  services: Service[];
  stylists: Stylist[];
  /** Indexed by day of week, 0 = Sunday. `null` = closed. */
  openingHours: (OpeningHours | null)[];
}

/** "closed" = salon closed, outside the booking window, or no suitable professional working. */
export type DayStatus = "available" | "fully-booked" | "closed";

export interface DayAvailability {
  date: ISODate;
  status: DayStatus;
}

export interface TimeSlot {
  time: ClockTime;
  /** Stylists free for the whole appointment starting at this time. */
  stylistIds: string[];
}

export interface AvailabilityQuery {
  /** `null` = any professional. */
  stylistId: string | null;
  serviceIds: string[];
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface BookingRequest extends AvailabilityQuery {
  date: ISODate;
  time: ClockTime;
  customer: Customer;
}

export interface BookingConfirmation {
  reference: string;
  stylistId: string;
  serviceIds: string[];
  date: ISODate;
  time: ClockTime;
  endTime: ClockTime;
  durationMin: number;
  total: number;
  /** Booking ID on the booking API (absent for the mock). */
  bookingId?: string;
  /** "pending_payment" = a deposit must be paid before the booking is confirmed. Absent = confirmed. */
  status?: "confirmed" | "pending_payment";
  /** Present when part of the price is paid online, in pounds. */
  deposit?: { now: number; atSalon: number; paid: boolean };
  /** While pending payment: when the slot is released (ISO instant). */
  expiresAt?: string;
}

/** The time held while paying ran out; the customer needs to choose a time again. */
export class BookingExpiredError extends Error {
  constructor(message = "The time we held for you has run out. Please choose a time again.") {
    super(message);
    this.name = "BookingExpiredError";
  }
}

export class SlotUnavailableError extends Error {
  constructor(message = "Sorry, that time has just been taken. Please choose another.") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

/** The contract any availability backend (mock, REST API, third-party) must satisfy. */
export interface BookingProvider {
  getCatalog(): Promise<Catalog>;
  getAvailableDates(query: AvailabilityQuery & { from: ISODate; to: ISODate }): Promise<DayAvailability[]>;
  getTimeSlots(query: AvailabilityQuery & { date: ISODate }): Promise<TimeSlot[]>;
  createBooking(request: BookingRequest): Promise<BookingConfirmation>;
  /** Test mode only: completes a pending deposit without taking money. */
  completeSimulatedPayment?(confirmation: BookingConfirmation): Promise<BookingConfirmation>;
}
