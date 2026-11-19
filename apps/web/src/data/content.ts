export const salon = {
  name: "Canary Wharf Salon",
  tagline: "Precision cuts, beautiful colour and a calm hour for yourself in the heart of E14.",
  address: ["Canary Wharf", "London E14"],
  phone: "020 0000 0000",
  email: "hello@canarywharfsalon.co.uk",
};

export const navLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About us" },
  { id: "bookings", label: "Bookings" },
  { id: "contact", label: "Contact" },
] as const;

export type Service = { name: string; price: string; duration: string };
export type ServiceGroup = { category: string; items: Service[] };

export const services: ServiceGroup[] = [
  {
    category: "Cut & Style",
    items: [
      { name: "Women's cut & blow-dry", price: "from £65", duration: "60 min" },
      { name: "Men's cut", price: "from £40", duration: "45 min" },
      { name: "Skin fade & beard trim", price: "from £45", duration: "50 min" },
      { name: "Blow-dry", price: "from £40", duration: "40 min" },
    ],
  },
  {
    category: "Colour",
    items: [
      { name: "Full head colour", price: "from £95", duration: "120 min" },
      { name: "Balayage", price: "from £150", duration: "180 min" },
      { name: "Root touch-up", price: "from £70", duration: "90 min" },
      { name: "Toner & gloss", price: "from £35", duration: "30 min" },
    ],
  },
  {
    category: "Treatments",
    items: [
      { name: "Deep-conditioning treatment", price: "from £30", duration: "30 min" },
      { name: "Scalp ritual & head massage", price: "from £35", duration: "30 min" },
      { name: "Keratin smoothing", price: "from £180", duration: "150 min" },
    ],
  },
];

export const openingHours = [
  { day: "Monday", hours: "Closed" },
  { day: "Tuesday – Friday", hours: "9:00 – 20:00" },
  { day: "Saturday", hours: "9:00 – 18:00" },
  { day: "Sunday", hours: "10:00 – 16:00" },
];

export const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00",
];
