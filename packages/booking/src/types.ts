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
  /** Booking for several people: ask each person's age, to offer what suits it (children). */
  askAge?: boolean;
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
  /** Ages it suits, in years (1.5 = 18 months), both ends included. Absent = any age. */
  ages?: { min?: number; max?: number };
  /** What a customer needs before booking it, e.g. a patch test 24 hours before colour, or a waiver. */
  needsFirst?: NeedsFirst;
}

/** What a service needs first: any one of `options` (the booking API enforces it). */
export interface NeedsFirst {
  options: { requirementId: string; name: string; minHoursBefore?: number }[];
  /** Services whose booking counts as one of them, e.g. the consultation & patch test. */
  bookServiceIds: string[];
  /** The salon's own words for it. */
  message?: string;
}

/** Something the customer has had done or signed (a patch test, a waiver), on their account. */
export interface RequirementRecord {
  requirementId: string;
  /** When it was done (or the booking that counts starts), as an ISO instant. */
  at: string;
  /** Last day it counts. Absent = no expiry. */
  validUntil?: ISODate;
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
  /** The salon sells memberships or packages with included visits (online or in person). */
  sellsMemberships?: boolean;
  /** Free cancellation and changes up to `windowHours` before the appointment; later, money paid online is kept. */
  cancellation?: { windowHours: number };
  /** Offers shown online: reductions on some services, days and times, some claimed by the customer. */
  offers?: Offer[];
}

/**
 * A reduction on services (`percentOff`, or `amountOff` in pounds) for services in `serviceIds` or `categoryIds`
 * (neither = all), starting on `days` (0 = Sunday) within `times`. With `claim`, it applies only when the
 * customer ticks it, and the salon checks it (a student ID, say). The booking system has the final word on price.
 */
export interface Offer {
  id: string;
  name: string;
  description?: string;
  percentOff?: number;
  amountOff?: number;
  serviceIds?: string[];
  categoryIds?: string[];
  days?: number[];
  times?: { start: ClockTime; end: ClockTime };
  claim?: { label: string; check: string };
  /** Only for bookings of at least this many people (each with a covered service), e.g. a family visit. */
  minPeople?: number;
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
  /** Offers the customer claims (`Offer.claim`). */
  offerIds?: string[];
}

/** One person in a booking for several people. */
export interface Person {
  /** Tells the people apart, e.g. "p1". */
  ref: string;
  audienceId: string;
  /** Whole years, for audiences that ask it. */
  age?: number;
  /** First name, optional. */
  name?: string;
}

/** A person with their services (one visit) and professional (`null` = anyone free). */
export interface PartyMember extends Person {
  serviceIds: string[];
  stylistId: string | null;
}

/** A start time for a party: who is with whom, and when each starts and finishes. */
export interface PartySlot {
  time: ClockTime;
  assignments: { ref: string; stylistId: string; time: ClockTime; endTime: ClockTime }[];
}

export interface PartyBookingRequest {
  party: PartyMember[];
  date: ISODate;
  /** The slot chosen: everyone is booked with the professionals it shows. */
  slot: PartySlot;
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
  /** A booking for several people: each person's services, professional and times. */
  people?: (Person & { serviceIds: string[]; stylistId: string; time: ClockTime; endTime: ClockTime })[];
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

/**
 * The customer doesn't have what a service needs first (e.g. a patch test at least 24 hours before colour). The
 * message is the salon's; `bookServiceIds` are services whose booking would meet it (a consultation).
 */
export class PrerequisiteMissingError extends Error {
  constructor(
    message: string,
    readonly bookServiceIds: string[] = [],
    /** They weren't signed in: what they've had done only counts when they are. */
    readonly signInMayHelp = false,
  ) {
    super(message);
    this.name = "PrerequisiteMissingError";
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
  /** Bookings to come, soonest first, and recent visits, newest first (their account page). */
  upcoming?: AccountVisit[];
  recent?: AccountVisit[];
  /** What they've had done or signed that still counts (a patch test, a waiver). */
  records?: RequirementRecord[];
}

/** A booking or past visit on the customer's account page. */
export interface AccountVisit {
  date: ISODate;
  time?: ClockTime;
  reference?: string;
  status?: string;
  services: string[];
  stylistName?: string;
}

/** A booking as its customer sees it on /manage, to change or cancel. Money in pounds. */
export interface ManagedBooking {
  reference: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show" | (string & {});
  date: ISODate;
  time: ClockTime;
  end: ClockTime;
  /** For several people, each service says who it's for (`person`, e.g. "Mia (3)") and when it starts. */
  services: { serviceId: string; name: string; stylistId: string; stylistName?: string; person?: string; time?: ClockTime }[];
  total: number;
  paid: number;
  /** Confirmed bookings: free cancellation until `deadline` (an instant); after it, `kept` stays with the salon. */
  cancellation?: { deadline: string; windowHours: number; late: boolean; refund: number; kept: number; usesVisits: boolean; visitsReturned: boolean };
  canCancel: boolean;
  /** Before the cancellation window, with one stylist: a new time can be picked online. */
  canReschedule: boolean;
  cancelled?: { at: string; byCustomer: boolean; refund: number; kept: number };
}

/** Opening someone's booking: the token from their email link, or (when absent) their sign-in. */
export interface ManageAccess {
  reference: string;
  token?: string;
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
  /** The signed-in customer changes their own name or phone. */
  updateCustomerProfile?(change: { firstName?: string; lastName?: string; phone?: string }): Promise<CustomerProfile>;
  /** The signed-in customer buys products (pending until paid). Absent where buying online isn't offered. */
  buyProducts?(request: { lines: { productId: string; quantity: number }[]; customer: { name: string; email: string; phone?: string } }): Promise<Purchase>;
  /** A purchase as it stands now (after paying, until the payment has gone through). */
  getPurchase?(purchase: Purchase): Promise<Purchase>;
  /** Test mode only: completes a purchase's payment without taking money. */
  completeSimulatedPurchase?(purchase: Purchase): Promise<Purchase>;
  /** A customer's own booking, to change or cancel (needs the booking system). */
  getManagedBooking?(access: ManageAccess): Promise<ManagedBooking>;
  cancelManagedBooking?(access: ManageAccess): Promise<ManagedBooking>;
  rescheduleManagedBooking?(access: ManageAccess, to: { date: ISODate; time: ClockTime }): Promise<ManagedBooking>;
  /** Several people in one booking (absent where it isn't offered: they book one by one). */
  getPartyDates?(query: { party: PartyMember[]; from: ISODate; to: ISODate }): Promise<DayAvailability[]>;
  getPartyTimes?(query: { party: PartyMember[]; date: ISODate }): Promise<PartySlot[]>;
  createPartyBooking?(request: PartyBookingRequest): Promise<BookingConfirmation>;
}
