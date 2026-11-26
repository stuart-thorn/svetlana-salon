import type { Catalog, Service } from "./types";

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

/** Every online booking takes 50% of the ("from") price; extras are paid in the salon (client, 24 Nov 2026). */
const DEPOSIT: Service["deposit"] = { percent: 50 };

/**
 * One person's visit (see visit.ts): a main service plus add-ons. Cuts and blow-dries can follow a colour; a deep
 * treatment can join a cut, blow-dry or colour; one colour, and one cut or blow-dry, per visit. The consultation and
 * patch test stand alone because the patch test has to be done before the colour appointment.
 */
const COLOUR_SERVICES = ["root-colour", "full-colour", "balayage"];
const CUTS = ["mens-two-number", "mens-graded", "mens-cut", "skin-fade", "mens-long", "mens-hair-design", "womens-cut", "womens-hair-design"];
const mens = { audienceIds: ["men"] };
const womens = { audienceIds: ["women"] };
const adults = { audienceIds: ["men", "women"] };
const cut = { exclusiveGroup: "haircut", addOnTo: { offeringIds: COLOUR_SERVICES } };
/** A patch test at least 24 hours before, or a waiver (client, 26 Nov 2026); the booking API enforces it. */
const PATCH_TEST: Service["needsFirst"] = {
  options: [
    { requirementId: "patch-test", name: "Patch test", minHoursBefore: 24 },
    { requirementId: "colour-waiver", name: "Colour waiver" },
  ],
  bookServiceIds: ["colour-consultation"],
  message:
    "Colour needs a free patch test at least 24 hours before your appointment. New to colour with us? Book a Colour consultation & patch test first, or call us. Had one with us already, or signed a waiver? Sign in to book.",
};
const colour = { ...adults, exclusiveGroup: "colour", needsFirst: PATCH_TEST };
/** Children's prices up to age 12 (client, 24 Nov 2026); from 13, hair type and time mean adult prices. */
const children = { audienceIds: ["children"], exclusiveGroup: "haircut" };
const UP_TO_12 = "Up to age 12; from 13, adult prices apply.";
const SIT_ALONE = "From about 4–5, once they can sit comfortably on their own; younger children: book the toddler haircut.";
const designDescription =
  "A tailored consultation and a bespoke cut designed around your face shape, head shape, hair texture, density, natural growth and lifestyle. The final price is agreed in advance.";

/**
 * N&G Canary Wharf's launch menu (prices updated 24 Nov 2026), subject to final confirmation.
 * Mirrored in bookable-agent's salon template (packages/templates/src/salon.ts): keep them in step.
 * Durations are the client's chair times; ranges are booked at their upper end. The buzz cut, beard trim,
 * T-section and half/full head highlights are off the menu until the salon's updated price list.
 */
export const catalog: Catalog = {
  salonName: "N&G Canary Wharf",
  categories: [
    { id: "men", name: "Men" },
    { id: "women", name: "Women" },
    { id: "children", name: "Children" },
    { id: "colour", name: "Colour & highlights" },
  ],
  audiences: [
    { id: "men", name: "Men's hair & grooming", description: "Cuts and fades" },
    { id: "women", name: "Women's hair", description: "Cuts, blow-dries and styling" },
    { id: "children", name: "Children's haircuts", description: "Boys and girls up to 12, toddlers from 18 months", askAge: true },
  ],
  services: [
    { id: "mens-two-number", categoryId: "men", name: "Two-number clipper cut", durationMin: 15, price: 25, ...mens, ...cut },
    { id: "mens-graded", categoryId: "men", name: "Graded cut", durationMin: 30, price: 30, ...mens, ...cut },
    { id: "mens-cut", categoryId: "men", name: "Men's standard cut", durationMin: 30, price: 40, description: "Scissor or clipper cut, wash and style.", ...mens, ...cut },
    { id: "skin-fade", categoryId: "men", name: "Skin fade", durationMin: 45, price: 45, ...mens, ...cut },
    { id: "mens-long", categoryId: "men", name: "Men's longer hair cut", durationMin: 60, price: 50, ...mens, ...cut },
    {
      id: "mens-hair-design",
      categoryId: "men",
      name: "Personalised Hair Design & Cut",
      durationMin: 60,
      price: 45,
      priceFrom: true,
      description: designDescription,
      ...mens,
      ...cut,
    },
    { id: "womens-cut", categoryId: "women", name: "Women's cut & finish", durationMin: 60, price: 70, priceFrom: true, description: "Consultation, wash, precision cut and finish. From £70, depending on hair length and thickness.", ...womens, ...cut },
    { id: "blow-dry", categoryId: "women", name: "Blow-dry", durationMin: 45, price: 50, description: "Wash and blow-dry, any length or style, with premium salon products.", ...womens, exclusiveGroup: "haircut", addOnTo: { offeringIds: COLOUR_SERVICES } },
    {
      id: "womens-hair-design",
      categoryId: "women",
      name: "Personalised Hair Design & Cut",
      durationMin: 90,
      price: 75,
      priceFrom: true,
      description: designDescription,
      ...womens,
      ...cut,
    },
    {
      id: "nanoplasty",
      categoryId: "women",
      name: "Nanoplasty smoothing",
      durationMin: 180,
      price: 250,
      priceFrom: true,
      description: "Organic, formaldehyde-free smoothing. 3 hours or more, depending on hair length and thickness.",
      ...womens,
    },
    { id: "deep-treatment", categoryId: "women", name: "Deep treatment", durationMin: 30, price: 40, priceFrom: true, description: "An intensive conditioning treatment, on its own or with a cut, blow-dry or colour. £40 for shorter hair up to £50 for longer hair.", ...adults, addOnTo: { offeringIds: [...CUTS, "blow-dry", ...COLOUR_SERVICES] } },
    { id: "boys-cut", categoryId: "children", name: "Boys' haircut (up to 12)", durationMin: 30, price: 30, description: `${UP_TO_12} ${SIT_ALONE}`, ...children, ages: { min: 4, max: 12 } },
    { id: "girls-cut", categoryId: "children", name: "Girls' haircut (up to 12)", durationMin: 30, price: 40, priceFrom: true, description: `${UP_TO_12} ${SIT_ALONE}`, ...children, ages: { min: 4, max: 12 } },
    { id: "toddler-cut", categoryId: "children", name: "Toddler haircut (18 months to 4)", durationMin: 20, price: 10, priceAgreed: true, deposit: { amount: 10 }, description: "For little ones from 18 months who can't yet sit on their own, with Svetlana. £10 to book; the price is agreed in the salon once she has seen your child and the cut they need, and your £10 counts towards it.", ...children, ages: { min: 1.5, max: 4 } },
    { id: "colour-consultation", categoryId: "colour", name: "Colour consultation & patch test", durationMin: 15, price: 0, description: "Free. Needed before your first colour with us: your colour appointment starts at least 24 hours (ideally 48) after it.", ...adults },
    { id: "root-colour", categoryId: "colour", name: "Roots colour", durationMin: 75, price: 70, priceFrom: true, ...colour, description: "About 30 minutes applying, then 40–45 minutes developing." },
    { id: "full-colour", categoryId: "colour", name: "Full head colour", durationMin: 75, price: 95, priceFrom: true, ...colour },
    { id: "balayage", categoryId: "colour", name: "Balayage", durationMin: 150, price: 180, priceFrom: true, ...colour, description: "Hand-painted, natural-looking lightening. Includes toner. About 2.5 hours or more." },
  ].map((s): Service => ({ deposit: DEPOSIT, ...s })),
  // Placeholder team until the client confirms its stylists.
  stylists: [
    {
      // The owner; the only stylist for toddlers (from 18 months; client, 24 Nov 2026).
      id: "svetlana",
      name: "Svetlana",
      role: "Owner & Stylist",
      serviceIds: ["womens-cut", "blow-dry", "womens-hair-design", "deep-treatment", "boys-cut", "girls-cut", "toddler-cut"],
      workingDays: [1, 2, 3, 4, 5],
    },
    {
      id: "elena",
      name: "Elena",
      role: "Senior Stylist",
      serviceIds: ["womens-cut", "blow-dry", "womens-hair-design", "nanoplasty", "deep-treatment", "boys-cut", "girls-cut", "colour-consultation", "root-colour", "full-colour", "balayage"],
      workingDays: [1, 2, 3, 4, 6],
    },
    {
      id: "marco",
      name: "Marco",
      role: "Colour Specialist",
      serviceIds: ["colour-consultation", "root-colour", "full-colour", "balayage", "blow-dry", "nanoplasty", "deep-treatment"],
      workingDays: [0, 3, 4, 5, 6],
    },
    {
      id: "aisha",
      name: "Aisha",
      role: "Stylist",
      serviceIds: ["womens-cut", "blow-dry", "boys-cut", "girls-cut", "mens-two-number", "mens-graded", "mens-cut", "deep-treatment"],
      workingDays: [0, 1, 2, 5, 6],
    },
    {
      id: "tom",
      name: "Tom",
      role: "Barber",
      serviceIds: ["mens-two-number", "mens-graded", "mens-cut", "skin-fade", "mens-long", "mens-hair-design", "boys-cut", "girls-cut", "deep-treatment"],
      workingDays: [1, 2, 3, 4, 6],
    },
  ],
  // As the booking system has them: Family Visit applies by itself to 3 or more people booked together.
  offers: [
    {
      id: "family-visit",
      name: "Family Visit",
      description: "15% off haircuts and blow-dries when 3 or more family members visit on the same day. Not colour.",
      percentOff: 15,
      serviceIds: [...CUTS, "boys-cut", "girls-cut", "toddler-cut", "blow-dry"],
      minPeople: 3,
    },
  ],
  openingHours: [
    { open: h(10), close: h(18) }, // Sun
    { open: h(8), close: h(19) }, // Mon–Fri
    { open: h(8), close: h(19) },
    { open: h(8), close: h(19) },
    { open: h(8), close: h(19) },
    { open: h(8), close: h(19) },
    { open: h(10), close: h(18) }, // Sat
  ],
};
