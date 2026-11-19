import type { Catalog } from "./types";

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

/** Placeholder catalogue: edit names, prices, durations and rotas here. */
export const catalog: Catalog = {
  salonName: "Canary Wharf Salon",
  categories: [
    { id: "cut", name: "Cut & Style" },
    { id: "colour", name: "Colour" },
    { id: "treatments", name: "Treatments" },
  ],
  services: [
    { id: "womens-cut", categoryId: "cut", name: "Women's cut & blow-dry", durationMin: 60, price: 65, description: "Consultation, wash, precision cut and finish." },
    { id: "mens-cut", categoryId: "cut", name: "Men's cut", durationMin: 45, price: 40, description: "Scissor or clipper cut, wash and style." },
    { id: "fade-beard", categoryId: "cut", name: "Skin fade & beard trim", durationMin: 60, price: 45 },
    { id: "blow-dry", categoryId: "cut", name: "Blow-dry", durationMin: 45, price: 40, description: "Wash and blow-dry: sleek, bouncy or waves." },
    { id: "full-colour", categoryId: "colour", name: "Full head colour", durationMin: 120, price: 95 },
    { id: "balayage", categoryId: "colour", name: "Balayage", durationMin: 180, price: 150, description: "Hand-painted, natural-looking lightening. Includes toner." },
    { id: "root-touch-up", categoryId: "colour", name: "Root touch-up", durationMin: 90, price: 70 },
    { id: "toner-gloss", categoryId: "colour", name: "Toner & gloss", durationMin: 30, price: 35 },
    { id: "deep-conditioning", categoryId: "treatments", name: "Deep-conditioning treatment", durationMin: 30, price: 30 },
    { id: "scalp-ritual", categoryId: "treatments", name: "Scalp ritual & head massage", durationMin: 30, price: 35 },
    { id: "keratin", categoryId: "treatments", name: "Keratin smoothing", durationMin: 150, price: 180 },
  ],
  stylists: [
    {
      id: "elena",
      name: "Elena",
      role: "Senior Stylist",
      serviceIds: ["womens-cut", "blow-dry", "full-colour", "balayage", "root-touch-up", "toner-gloss", "deep-conditioning", "scalp-ritual", "keratin"],
      workingDays: [2, 3, 4, 5, 6],
    },
    {
      id: "marco",
      name: "Marco",
      role: "Colour Specialist",
      serviceIds: ["full-colour", "balayage", "root-touch-up", "toner-gloss", "blow-dry", "deep-conditioning"],
      workingDays: [0, 3, 4, 5, 6],
    },
    {
      id: "aisha",
      name: "Aisha",
      role: "Stylist",
      serviceIds: ["womens-cut", "mens-cut", "blow-dry", "toner-gloss", "deep-conditioning", "scalp-ritual"],
      workingDays: [0, 2, 4, 5, 6],
    },
    {
      id: "tom",
      name: "Tom",
      role: "Barber",
      serviceIds: ["mens-cut", "fade-beard", "scalp-ritual"],
      workingDays: [2, 3, 4, 5, 6],
    },
  ],
  openingHours: [
    { open: h(10), close: h(16) }, // Sun
    null, // Mon – closed
    { open: h(9), close: h(20) },
    { open: h(9), close: h(20) },
    { open: h(9), close: h(20) },
    { open: h(9), close: h(20) },
    { open: h(9), close: h(18) }, // Sat
  ],
};
