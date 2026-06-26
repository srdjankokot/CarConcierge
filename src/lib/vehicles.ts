// Kuriran spisak marki i modela (regionalno tržište). "Drugo" se rešava u UI-u
// kao slobodan unos, pa lista ne mora da bude potpuna.
// slug → logo u /public/car-logos/{slug}.png
export interface VehicleMake {
  make: string;
  slug: string;
  models: string[];
}

export const VEHICLE_MAKES: VehicleMake[] = [
  { make: "Volkswagen", slug: "volkswagen", models: ["Golf", "Polo", "Passat", "Tiguan", "Touran", "Caddy", "Jetta", "Up!", "T-Roc", "T-Cross", "Arteon", "Sharan", "Touareg", "Amarok"] },
  { make: "Audi", slug: "audi", models: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "TT"] },
  { make: "BMW", slug: "bmw", models: ["Serija 1", "Serija 2", "Serija 3", "Serija 4", "Serija 5", "Serija 6", "Serija 7", "X1", "X2", "X3", "X4", "X5", "X6", "X7"] },
  { make: "Mercedes-Benz", slug: "mercedes-benz", models: ["A klasa", "B klasa", "C klasa", "E klasa", "S klasa", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "Vito", "Sprinter"] },
  { make: "Škoda", slug: "skoda", models: ["Fabia", "Octavia", "Superb", "Rapid", "Scala", "Kamiq", "Karoq", "Kodiaq", "Roomster", "Yeti"] },
  { make: "Opel", slug: "opel", models: ["Corsa", "Astra", "Insignia", "Zafira", "Mokka", "Crossland", "Grandland", "Vectra", "Meriva", "Combo"] },
  { make: "Renault", slug: "renault", models: ["Clio", "Megane", "Captur", "Kadjar", "Scenic", "Talisman", "Twingo", "Laguna", "Espace", "Kangoo"] },
  { make: "Peugeot", slug: "peugeot", models: ["206", "207", "208", "307", "308", "508", "2008", "3008", "5008", "Partner"] },
  { make: "Citroën", slug: "citroen", models: ["C1", "C3", "C4", "C5", "Berlingo", "C3 Picasso", "C4 Picasso", "Xsara Picasso"] },
  { make: "Fiat", slug: "fiat", models: ["Punto", "Panda", "Tipo", "500", "500L", "500X", "Doblo", "Bravo", "Stilo"] },
  { make: "Toyota", slug: "toyota", models: ["Aygo", "Yaris", "Corolla", "Auris", "Avensis", "C-HR", "RAV4", "Camry"] },
  { make: "Ford", slug: "ford", models: ["Ka", "Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "C-Max", "S-Max", "Galaxy", "Transit"] },
  { make: "Hyundai", slug: "hyundai", models: ["i10", "i20", "i30", "i40", "Accent", "Tucson", "Santa Fe", "Kona", "ix35"] },
  { make: "Kia", slug: "kia", models: ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Stonic", "Venga", "Soul"] },
  { make: "Nissan", slug: "nissan", models: ["Micra", "Note", "Qashqai", "X-Trail", "Juke", "Primera", "Almera"] },
  { make: "Mazda", slug: "mazda", models: ["2", "3", "5", "6", "CX-3", "CX-30", "CX-5"] },
  { make: "Honda", slug: "honda", models: ["Civic", "Accord", "CR-V", "Jazz", "HR-V"] },
  { make: "Seat", slug: "seat", models: ["Ibiza", "Leon", "Arona", "Ateca", "Toledo", "Alhambra", "Cordoba"] },
  { make: "Dacia", slug: "dacia", models: ["Sandero", "Logan", "Duster", "Lodgy", "Dokker", "Spring"] },
  { make: "Volvo", slug: "volvo", models: ["V40", "V60", "V70", "S60", "S80", "XC40", "XC60", "XC90"] },
  { make: "Suzuki", slug: "suzuki", models: ["Swift", "Vitara", "SX4", "Ignis", "Baleno", "Jimny"] },
  { make: "Mitsubishi", slug: "mitsubishi", models: ["Colt", "Lancer", "Outlander", "ASX", "Pajero"] },
  { make: "Alfa Romeo", slug: "alfa-romeo", models: ["Giulietta", "Giulia", "147", "156", "159", "Mito", "Stelvio"] },
  { make: "Jeep", slug: "jeep", models: ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler"] },
  { make: "Mini", slug: "mini", models: ["Cooper", "One", "Countryman", "Clubman"] },
  { make: "Chevrolet", slug: "chevrolet", models: ["Spark", "Aveo", "Cruze", "Captiva", "Lacetti", "Kalos"] },
  { make: "Lada", slug: "lada", models: ["Niva", "Samara", "110", "Granta"] },
  { make: "Smart", slug: "smart", models: ["ForTwo", "ForFour"] },
];

export const MAKE_SLUG: Record<string, string> = Object.fromEntries(
  VEHICLE_MAKES.map((m) => [m.make, m.slug]),
);

const currentYear = new Date().getFullYear();
export const VEHICLE_YEARS: number[] = Array.from(
  { length: currentYear + 1 - 1995 + 1 },
  (_, i) => currentYear + 1 - i,
);
