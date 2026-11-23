export const salon = {
  name: "N&G Canary Wharf",
  legalName: "N&G Canary Wharf Ltd",
  tagline:
    "Accessible premium hair for everyone: precision men's grooming, women's cutting and colour, and children's cuts in the heart of E14.",
  /** Visitors find us by floor and landmarks, so the Mezzanine Floor comes first (client, 23 Nov 2026). */
  address: ["Mezzanine Floor, Jubilee Place", "Unit 38C, Canary Wharf", "London E14 5NY"],
  directions:
    "In the main central hall of Jubilee Place, behind Café Brera and near Starbucks and Pret: take the escalator up from the main walkway. We're not in the passage by Wagamama.",
  phone: "020 7512 9890",
  email: "info@ngcanarywharf.co.uk",
  /** Instagram profile URL; the link shows once the client gives us the handle. */
  instagram: undefined as string | undefined,
  company: {
    name: "N&G CANARY WHARF LTD",
    number: "17349131",
    registeredOffice: "124–128 City Road, London, EC1V 2NX",
  },
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
  "Thursday and Friday sometimes until 20:00. Bank holidays usually 11:00 – 18:00, with longer hours over Christmas. Same-day appointments and walk-ins are welcome when we have space.";

export interface Offer {
  title: string;
  summary: string;
  details: string[];
  /** Shown first and picked out (the client asked for the student offer to be highlighted). */
  featured?: boolean;
}

export const offers: Offer[] = [
  {
    title: "Student offer",
    summary: "10% off haircuts, Monday to Friday, 2pm – 5pm.",
    details: [
      "Show a valid student ID in the salon.",
      "Not combined with other offers or memberships.",
    ],
    featured: true,
  },
  {
    title: "Blow-dry package",
    summary: "£180 for 4 blow-dries, and the 5th is free.",
    details: ["Prepaid, for one person.", "No expiry date."],
  },
  {
    title: "Family Visit",
    summary: "15% off when 3 or more family members have their haircuts or blow-dries on the same day.",
    details: ["For example, parents and a child, or a parent with two children.", "Not combined with other offers."],
  },
];

export interface MembershipTier {
  name: string;
  term: string;
  visits: string;
  standard: number;
  discount: number;
  price: number;
}

/** Men's haircut memberships (client's table, 23 Nov 2026). Full haircut £40, back & sides £30. */
export const memberships = {
  title: "Men's haircut memberships",
  summary: "Keep your cut sharp with a visit every 2½ to 3 weeks, paid once upfront.",
  tiers: [
    { name: "Junior", term: "3 months", visits: "5 visits: 3 full haircuts + 2 back & sides", standard: 180, discount: 10, price: 162 },
    { name: "Executive", term: "6 months", visits: "10 visits: 6 full haircuts + 4 back & sides", standard: 360, discount: 15, price: 306 },
    { name: "Founder", term: "12 months", visits: "20 visits: 12 full haircuts + 8 back & sides", standard: 720, discount: 20, price: 576 },
  ] satisfies MembershipTier[],
  terms: [
    "Men's full haircuts and back & sides visits only.",
    "One payment upfront: no Direct Debit, nothing renews automatically.",
    "Use your visits within the term; unused visits expire at the end.",
    "A pass for Apple Wallet or Google Wallet, with a QR code to check in at each visit.",
  ],
};

/** Pre-launch build (`--mode prelaunch`): no booking buttons, and a note that online booking is coming. */
export const isPrelaunch = import.meta.env.VITE_PRELAUNCH === "true";
export const prelaunchNote = "Our new website and online booking are coming shortly.";
