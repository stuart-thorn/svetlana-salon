export const salon = {
  name: "N&G Canary Wharf",
  legalName: "N&G Canary Wharf Ltd",
  tagline:
    "Accessible premium hair for everyone: precision men's grooming, women's cutting and colour, and children's cuts in the heart of E14.",
  address: ["Unit 38C, Jubilee Place", "Canary Wharf", "London E14 5NY"],
  // Placeholders until the client confirms them.
  phone: "020 0000 0000",
  email: "hello@ngcanarywharf.co.uk",
  /** Shown wherever launch or commercial details appear. */
  launchNote: "Opening details, prices and offers are subject to final confirmation.",
};

export const navLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "bookings", label: "Prices" },
  { id: "offers", label: "Offers" },
  { id: "contact", label: "Contact" },
] as const;

export const openingHours = [
  { day: "Monday – Friday", hours: "8:00 – 19:00" },
  { day: "Saturday – Sunday", hours: "10:00 – 18:00" },
];

export const hoursNote =
  "Selected late appointments until 20:00 on weekdays. Same-day appointments and walk-ins are welcome when we have space.";

export interface Offer {
  title: string;
  summary: string;
  details: string[];
}

export const offers: Offer[] = [
  {
    title: "Blow-dry package",
    summary: "Buy 4 blow-dries, get the 5th complimentary.",
    details: ["Prepaid, for one person.", "Use them on any blow-dry appointment."],
  },
  {
    title: "Memberships",
    summary: "Junior, Executive and Founder tiers on 3, 6 or 12-month terms.",
    details: [
      "Structured benefits for regular visits (not unlimited services).",
      "A digital membership card for Apple Wallet or Google Wallet, with a QR code for quick check-in and renewal.",
    ],
  },
  {
    title: "Family Visit",
    summary: "15% off when family members have their haircuts or blow-dries together on the same day.",
    details: ["Excludes colour and complex technical services."],
  },
];
