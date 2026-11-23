import type { Catalog, Service } from "./types";

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

/** Colour, highlights and Nanoplasty take 50% of the "from" price online; extras are paid in the salon (client, 23 Nov 2026). */
const DEPOSIT: Service["deposit"] = { percent: 50 };

/**
 * One person's visit (see visit.ts): a main service plus add-ons. Cuts, beard trims and blow-dries can follow
 * a colour; a beard trim can follow a men's cut; one colour, and one cut or blow-dry, per visit. The consultation and patch
 * test stand alone because the patch test has to be done before the colour appointment.
 */
const COLOUR_SERVICES = ["root-colour", "full-colour", "t-section", "half-highlights", "highlights", "balayage"];
const mens = { audienceIds: ["men"] };
const womens = { audienceIds: ["women"] };
const adults = { audienceIds: ["men", "women"] };
const cut = { exclusiveGroup: "haircut", addOnTo: { offeringIds: COLOUR_SERVICES } };
const colour = { ...adults, exclusiveGroup: "colour", deposit: DEPOSIT };
const designDescription =
  "A tailored consultation and a bespoke cut designed around your face shape, head shape, hair texture, density, natural growth and lifestyle. The final price is agreed in advance.";

/**
 * N&G Canary Wharf's launch menu (prices updated 23 Nov 2026), subject to final confirmation.
 * Mirrored in bookable-agent's salon template (packages/templates/src/salon.ts): keep them in step.
 * Durations are the client's chair times; ranges are booked at their upper end. Prices for the beard trim,
 * consultation, buzz cut, full head colour, T-section and half/full head highlights are still unconfirmed.
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
    { id: "men", name: "Men's hair & grooming", description: "Cuts, fades and beard trims" },
    { id: "women", name: "Women's hair", description: "Cuts, blow-dries and styling" },
    { id: "children", name: "Children's haircuts", description: "Cuts for boys and girls" },
  ],
  services: [
    { id: "mens-two-number", categoryId: "men", name: "Two-number clipper cut", durationMin: 15, price: 25, ...mens, ...cut },
    { id: "mens-buzz", categoryId: "men", name: "Buzz cut", durationMin: 15, price: 20, ...mens, ...cut },
    { id: "mens-graded", categoryId: "men", name: "Graded cut", durationMin: 30, price: 30, ...mens, ...cut },
    { id: "mens-cut", categoryId: "men", name: "Men's standard cut", durationMin: 30, price: 40, description: "Scissor or clipper cut, wash and style.", ...mens, ...cut },
    { id: "skin-fade", categoryId: "men", name: "Skin fade", durationMin: 45, price: 45, ...mens, ...cut },
    { id: "mens-long", categoryId: "men", name: "Men's longer hair cut", durationMin: 60, price: 50, ...mens, ...cut },
    { id: "beard-trim", categoryId: "men", name: "Beard trim & shape", durationMin: 20, price: 15, ...mens, addOnTo: { categoryIds: ["men"] } },
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
    { id: "blow-dry", categoryId: "women", name: "Blow-dry", durationMin: 45, price: 40, priceFrom: true, description: "Wash and blow-dry: sleek, bouncy or waves. £40 for shorter hair up to £55 for longer hair.", ...womens, exclusiveGroup: "haircut", addOnTo: { offeringIds: COLOUR_SERVICES } },
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
      deposit: DEPOSIT,
      ...womens,
    },
    { id: "deep-treatment", categoryId: "women", name: "Deep treatment", durationMin: 30, price: 40, priceFrom: true, description: "An intensive conditioning treatment. £40 for shorter hair up to £50 for longer hair.", ...womens },
    { id: "kids-cut", categoryId: "children", name: "Children's haircut", durationMin: 30, price: 30, priceFrom: true, audienceIds: ["children"], exclusiveGroup: "haircut" },
    { id: "colour-consultation", categoryId: "colour", name: "Colour consultation & patch test", durationMin: 15, price: 0, description: "Needed at least 24 hours (ideally 48) before your first colour appointment.", ...adults },
    { id: "root-colour", categoryId: "colour", name: "Colour / regrowth", durationMin: 75, price: 70, priceFrom: true, ...colour, description: "About 30 minutes applying, then 40–45 minutes developing." },
    { id: "full-colour", categoryId: "colour", name: "Full head colour", durationMin: 75, price: 95, priceFrom: true, ...colour },
    { id: "t-section", categoryId: "colour", name: "T-section highlights", durationMin: 30, price: 60, priceFrom: true, ...colour, description: "Highlights along the parting and hairline. Includes toner." },
    { id: "half-highlights", categoryId: "colour", name: "Half head highlights / colour", durationMin: 60, price: 90, priceFrom: true, ...colour, description: "Foil highlights or colour on the top and sides. Includes toner." },
    { id: "highlights", categoryId: "colour", name: "Full head highlights", durationMin: 150, price: 120, priceFrom: true, ...colour, description: "Foil highlights through the whole head. Includes toner." },
    { id: "balayage", categoryId: "colour", name: "Balayage", durationMin: 150, price: 180, priceFrom: true, ...colour, description: "Hand-painted, natural-looking lightening. Includes toner. About 2.5 hours or more." },
  ],
  // Placeholder team until the client confirms its stylists.
  stylists: [
    {
      id: "elena",
      name: "Elena",
      role: "Senior Stylist",
      serviceIds: ["womens-cut", "blow-dry", "womens-hair-design", "nanoplasty", "deep-treatment", "kids-cut", "colour-consultation", "root-colour", "full-colour", "t-section", "half-highlights", "highlights", "balayage"],
      workingDays: [1, 2, 3, 4, 6],
    },
    {
      id: "marco",
      name: "Marco",
      role: "Colour Specialist",
      serviceIds: ["colour-consultation", "root-colour", "full-colour", "t-section", "half-highlights", "highlights", "balayage", "blow-dry", "nanoplasty", "deep-treatment"],
      workingDays: [0, 3, 4, 5, 6],
    },
    {
      id: "aisha",
      name: "Aisha",
      role: "Stylist",
      serviceIds: ["womens-cut", "blow-dry", "kids-cut", "mens-two-number", "mens-buzz", "mens-graded", "mens-cut"],
      workingDays: [0, 1, 2, 5, 6],
    },
    {
      id: "tom",
      name: "Tom",
      role: "Barber",
      serviceIds: ["mens-two-number", "mens-buzz", "mens-graded", "mens-cut", "skin-fade", "mens-long", "beard-trim", "mens-hair-design", "kids-cut"],
      workingDays: [1, 2, 3, 4, 6],
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
