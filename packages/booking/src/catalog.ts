import type { Catalog, Service } from "./types";

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

/** Complex technical colour and highlights take a 50% deposit online (client brief, Nov 2026). */
const COLOUR_DEPOSIT: Service["deposit"] = { percent: 50 };

/**
 * N&G Canary Wharf's indicative launch menu, subject to final confirmation.
 * Mirrored in bookable-agent's seed (infra/local/src/fixtures/canary-wharf-salon.ts): keep them in step.
 * Durations, the beard trim price and the consultation price are placeholders until the client confirms them.
 */
export const catalog: Catalog = {
  salonName: "N&G Canary Wharf",
  categories: [
    { id: "men", name: "Men" },
    { id: "women", name: "Women" },
    { id: "children", name: "Children" },
    { id: "colour", name: "Colour & highlights" },
  ],
  services: [
    { id: "mens-two-number", categoryId: "men", name: "Two-number clipper cut", durationMin: 30, price: 25 },
    { id: "mens-graded", categoryId: "men", name: "Graded cut", durationMin: 30, price: 30 },
    { id: "mens-cut", categoryId: "men", name: "Men's standard cut", durationMin: 45, price: 40, description: "Scissor or clipper cut, wash and style." },
    { id: "skin-fade", categoryId: "men", name: "Skin fade", durationMin: 45, price: 45 },
    { id: "mens-long", categoryId: "men", name: "Men's longer hair cut", durationMin: 60, price: 50 },
    { id: "beard-trim", categoryId: "men", name: "Beard trim & shape", durationMin: 20, price: 15 },
    {
      id: "mens-hair-design",
      categoryId: "men",
      name: "Personalised Hair Design & Cut",
      durationMin: 60,
      price: 45,
      priceFrom: true,
      description: "A consultation-led cut designed around your hair, face shape and routine.",
    },
    { id: "womens-cut", categoryId: "women", name: "Women's cut & finish", durationMin: 60, price: 70, priceFrom: true, description: "Consultation, wash, precision cut and finish. £70–£90." },
    { id: "blow-dry", categoryId: "women", name: "Blow-dry", durationMin: 45, price: 45, priceFrom: true, description: "Wash and blow-dry: sleek, bouncy or waves." },
    {
      id: "womens-hair-design",
      categoryId: "women",
      name: "Personalised Hair Design & Cut",
      durationMin: 90,
      price: 75,
      priceFrom: true,
      description: "An in-depth consultation and a cut designed around your hair, face shape and routine.",
    },
    { id: "kids-cut", categoryId: "children", name: "Children's haircut", durationMin: 30, price: 30, priceFrom: true },
    { id: "colour-consultation", categoryId: "colour", name: "Colour consultation & patch test", durationMin: 15, price: 0, description: "Recommended before your first colour appointment." },
    { id: "root-colour", categoryId: "colour", name: "Root colour", durationMin: 90, price: 70, priceFrom: true, deposit: COLOUR_DEPOSIT },
    { id: "full-colour", categoryId: "colour", name: "Full head colour", durationMin: 120, price: 95, priceFrom: true, deposit: COLOUR_DEPOSIT },
    { id: "highlights", categoryId: "colour", name: "Highlights", durationMin: 150, price: 120, priceFrom: true, deposit: COLOUR_DEPOSIT, description: "Foil highlights, half or full head. Includes toner." },
    { id: "balayage", categoryId: "colour", name: "Balayage", durationMin: 180, price: 150, priceFrom: true, deposit: COLOUR_DEPOSIT, description: "Hand-painted, natural-looking lightening. Includes toner. Up to £180." },
  ],
  // Placeholder team until the client confirms its stylists.
  stylists: [
    {
      id: "elena",
      name: "Elena",
      role: "Senior Stylist",
      serviceIds: ["womens-cut", "blow-dry", "womens-hair-design", "kids-cut", "colour-consultation", "root-colour", "full-colour", "highlights", "balayage"],
      workingDays: [1, 2, 3, 4, 6],
    },
    {
      id: "marco",
      name: "Marco",
      role: "Colour Specialist",
      serviceIds: ["colour-consultation", "root-colour", "full-colour", "highlights", "balayage", "blow-dry"],
      workingDays: [0, 3, 4, 5, 6],
    },
    {
      id: "aisha",
      name: "Aisha",
      role: "Stylist",
      serviceIds: ["womens-cut", "blow-dry", "kids-cut", "mens-two-number", "mens-graded", "mens-cut"],
      workingDays: [0, 1, 2, 5, 6],
    },
    {
      id: "tom",
      name: "Tom",
      role: "Barber",
      serviceIds: ["mens-two-number", "mens-graded", "mens-cut", "skin-fade", "mens-long", "beard-trim", "mens-hair-design", "kids-cut"],
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
