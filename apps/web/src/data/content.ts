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

export const openingHours = [
  { day: "Monday", hours: "Closed" },
  { day: "Tuesday – Friday", hours: "9:00 – 20:00" },
  { day: "Saturday", hours: "9:00 – 18:00" },
  { day: "Sunday", hours: "10:00 – 16:00" },
];
