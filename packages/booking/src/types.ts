/** ISO calendar date in salon local time, e.g. "2026-11-24". */
export type ISODate = string;
/** Wall-clock time in salon local time, e.g. "09:15". */
export type ClockTime = string;

export interface Category {
  id: string;
  name: string;
}

/** Who services are for, shown as a choice of menu, e.g. "Women's hair". */
export interface Audience {
  id: string;
  name: string;
  description?: string;
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
  /** Audiences it's offered to. Absent = everyone. */
  audienceIds?: string[];
  /** `false` = only bookable as an add-on to another service. Default true. */
  standalone?: boolean;
  /** Can be added to a visit that includes one of these. Absent = never an add-on. */
  addOnTo?: { categoryIds?: string[]; offeringIds?: string[] };
  /** A visit holds at most one service from each group, e.g. "haircut". */
  exclusiveGroup?: string;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  /** Their headshot, when the salon has added one (from the booking system's catalogue). */
  photoUrl?: string;
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
  /** In display order. Empty = no audience filter. */
  audiences: Audience[];
  /** The business's question above `audiences`, e.g. "Who's the appointment for?". Absent = the site's own wording. */
  audiencesPrompt?: string;
  /** In menu order, which is also the order add-ons are performed in. */
  services: Service[];
  stylists: Stylist[];
  /** Indexed by day of week, 0 = Sunday. `null` = closed. */
  openingHours: (OpeningHours | null)[];
  /** Memberships, packages and products the salon sells online (live booking system only). */
  products?: Product[];
}

/** Something the salon sells online outside a booking: a membership, a package or a retail product. */
export interface Product {
  id: string;
  name: string;
  description?: string;
  kind: "membership" | "retail";
  /** In pounds. */
  price: number;
  /** For memberships: the term, the tier and the visits included. */
  membership?: { termMonths?: number; tier?: string; allowances: { id: string; label: string; count: number }[] };
}

/** One of the signed-in customer's memberships, with the visits they have left. */
export interface MembershipSummary {
  id: string;
  name: string;
  tier?: string;
  validFrom: ISODate;
  /** Last day it can be used. Absent = no expiry. */
  validTo?: ISODate;
  /** In force today (false = starts later). */
  current: boolean;
  /** `offeringIds`: the services a visit can be used for. */
  allowances: { label: string; count: number; left: number; offeringIds: string[] }[];
}

/** A service in the basket, with the membership visit that will pay for it (signed-in customers). */
export type PricedService = Service & { included?: { membershipName: string; label: string } };

/** A purchase made on the site: pending until its payment goes through, then paid with its memberships. */
export interface Purchase {
  orderId: string;
  reference: string;
  status: "pending_payment" | "part_paid" | "paid" | "cancelled" | "refunded";
  /** In pounds. */
  total: number;
  lines: { name: string; quantity: number }[];
  memberships: MembershipSummary[];
  /** While pending: how to pay. */
  payment?: OnlinePayment;
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
  /** While pending payment: how to take the deposit. Absent = a simulated (test) payment. */
  payment?: OnlinePayment;
}

/**
 * How the deposit is taken: Stripe's Payment Element, on the salon's own Stripe account (`accountRef`), or a
 * simulated payment in test mode.
 */
export type OnlinePayment =
  | { kind: "stripe"; clientSecret: string; publishableKey: string; accountRef?: string }
  | { kind: "simulated" };

/** The salon can't take the deposit online right now (no payment account connected). */
export class PaymentsUnavailableError extends Error {
  constructor(message = "We can't take deposits online at the moment. Please call us to book.") {
    super(message);
    this.name = "PaymentsUnavailableError";
  }
}

/** The time held while paying ran out; the customer needs to choose a time again. */
export class BookingExpiredError extends Error {
  constructor(message = "The time we held for you has run out. Please choose a time again.") {
    super(message);
    this.name = "BookingExpiredError";
  }
}

/** The chosen services don't make one person's visit (e.g. a men's and a women's cut). */
export class IncompatibleServicesError extends Error {
  constructor(message = "Those services can't be booked together. Please change your selection.") {
    super(message);
    this.name = "IncompatibleServicesError";
  }
}

export class SlotUnavailableError extends Error {
  constructor(message = "Sorry, that time has just been taken. Please choose another.") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

/** The contract any availability backend (mock, REST API, third-party) must satisfy. */
/** The signed-in customer as the salon knows them (GET /me), for filling in the form and "last time with…". */
export interface CustomerProfile {
  email: string;
  /** Absent for someone the salon hasn't seen before. */
  customer?: {
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    lastVisit?: { date: ISODate; stylistId?: string; stylistName?: string; services: string[]; serviceIds: string[] };
  };
  /** Their memberships in force or still to come. */
  memberships?: MembershipSummary[];
}

export interface BookingProvider {
  getCatalog(): Promise<Catalog>;
  getAvailableDates(query: AvailabilityQuery & { from: ISODate; to: ISODate }): Promise<DayAvailability[]>;
  getTimeSlots(query: AvailabilityQuery & { date: ISODate }): Promise<TimeSlot[]>;
  createBooking(request: BookingRequest): Promise<BookingConfirmation>;
  /** Test mode only: completes a pending deposit without taking money. */
  completeSimulatedPayment?(confirmation: BookingConfirmation): Promise<BookingConfirmation>;
  /** The booking as it stands now (after paying a deposit, until the payment has confirmed it). */
  getBookingStatus?(confirmation: BookingConfirmation): Promise<BookingConfirmation>;
  /** The signed-in customer (needs a customer token); absent where customer sign-in isn't offered. */
  getCustomerProfile?(): Promise<CustomerProfile>;
  /** The signed-in customer buys products (pending until paid). Absent where buying online isn't offered. */
  buyProducts?(request: { lines: { productId: string; quantity: number }[]; customer: { name: string; email: string; phone?: string } }): Promise<Purchase>;
  /** A purchase as it stands now (after paying, until the payment has gone through). */
  getPurchase?(purchase: Purchase): Promise<Purchase>;
  /** Test mode only: completes a purchase's payment without taking money. */
  completeSimulatedPurchase?(purchase: Purchase): Promise<Purchase>;
}
