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
  /** Instagram profile URL (@ng_canarywharf, client, 24 Nov 2026). */
  instagram: "https://www.instagram.com/ng_canarywharf/" as string | undefined,
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
  "On some evenings (often Thursday and Friday) and over Christmas we're open until 20:00; those times show in online booking. Bank holidays usually 11:00 – 18:00. Walk-ins are welcome when we have a free slot, but not guaranteed, especially at lunchtime and in the evening: booking ahead, even the same day, is the best way to get the time you want.";

export interface Offer {
  title: string;
  summary: string;
  details: string[];
  /** Shown first and picked out (the client asked for the student offer to be highlighted). */
  featured?: boolean;
  /** For several people together: links to the group booking. */
  group?: boolean;
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
    summary: "4 blow-dries for £180, paid upfront: save £20 on 4 at £50.",
    details: [
      "Valid for 1 month, ideal for a weekly blow-dry (a few days' flexibility at the salon's discretion).",
      "For one person. Book each blow-dry as usual: no deposit for package visits.",
    ],
  },
  {
    title: "Family Visit",
    group: true,
    summary: "15% off haircuts and blow-dries when 3 or more family members visit on the same day.",
    details: [
      "For example, a parent with two children, or both parents and a child.",
      "Book everyone together online (\"Family or group\") and it's applied automatically, or tell us at the desk: no proof needed.",
      "Not colour. Not combined with memberships, prepaid visits or other offers.",
    ],
  },
];

export interface MembershipTier {
  name: string;
  term: string;
  visits: string;
  /** What the visits cost at standard prices, and the club price (pounds). */
  standard: number;
  price: number;
}

/**
 * Men's haircut clubs (client, 24 Nov 2026). Standard men's haircut £40, skin fade £45, back & sides (graded
 * cut) £30. Each club's last visit is free. Sold in the salon first.
 */
export const memberships = {
  /** Shown with the terms only while no club can be bought online. */
  notOnlineNote: "Join in the salon. Buying online is coming soon.",
  title: "Men's haircut clubs",
  summary: "Keep your cut sharp with regular visits, paid once upfront. The last visit is on us.",
  tiers: [
    { name: "Skin Fade Club", term: "3 months", visits: "2 skin fades + 2 back & sides, then a 5th back & sides free", standard: 180, price: 150 },
    { name: "Classic Club", term: "3 months", visits: "5 men's haircuts: the 5th free", standard: 200, price: 170 },
    { name: "Exclusive Club", term: "6 months", visits: "6 men's haircuts: the 6th free", standard: 240, price: 190 },
    { name: "Premium Club", term: "12 months", visits: "13 men's haircuts: the 13th free", standard: 520, price: 420 },
  ] satisfies MembershipTier[],
  terms: [
    "Men's haircuts only (the Skin Fade Club: skin fades and back & sides clean-ups).",
    "One payment upfront: no Direct Debit, nothing renews automatically.",
    "Use your visits within the term; unused visits expire at the end.",
  ],
};

/** Pre-launch build (`--mode prelaunch`): no booking buttons, and a note that online booking is coming. */
export const isPrelaunch = import.meta.env.VITE_PRELAUNCH === "true";
export const prelaunchNote = "Our new website and online booking are coming shortly.";
