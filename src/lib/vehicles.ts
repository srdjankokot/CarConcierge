// Kuriran spisak marki i modela (regionalno tržište). "Drugo" se rešava u UI-u
// kao slobodan unos, pa lista ne mora da bude potpuna.
export interface VehicleMake {
  make: string;
  models: string[];
}

export const VEHICLE_MAKES: VehicleMake[] = [
  { make: "Volkswagen", models: ["Golf", "Polo", "Passat", "Tiguan", "Touran", "Caddy", "Jetta", "Up!", "T-Roc", "T-Cross", "Arteon", "Sharan", "Touareg", "Amarok"] },
  { make: "Audi", models: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "TT"] },
  { make: "BMW", models: ["Serija 1", "Serija 2", "Serija 3", "Serija 4", "Serija 5", "Serija 6", "Serija 7", "X1", "X2", "X3", "X4", "X5", "X6", "X7"] },
  { make: "Mercedes-Benz", models: ["A klasa", "B klasa", "C klasa", "E klasa", "S klasa", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "Vito", "Sprinter"] },
  { make: "Škoda", models: ["Fabia", "Octavia", "Superb", "Rapid", "Scala", "Kamiq", "Karoq", "Kodiaq", "Roomster", "Yeti"] },
  { make: "Opel", models: ["Corsa", "Astra", "Insignia", "Zafira", "Mokka", "Crossland", "Grandland", "Vectra", "Meriva", "Combo"] },
  { make: "Renault", models: ["Clio", "Megane", "Captur", "Kadjar", "Scenic", "Talisman", "Twingo", "Laguna", "Espace", "Kangoo"] },
  { make: "Peugeot", models: ["206", "207", "208", "307", "308", "508", "2008", "3008", "5008", "Partner"] },
  { make: "Citroën", models: ["C1", "C3", "C4", "C5", "Berlingo", "C3 Picasso", "C4 Picasso", "Xsara Picasso"] },
  { make: "Fiat", models: ["Punto", "Panda", "Tipo", "500", "500L", "500X", "Doblo", "Bravo", "Stilo"] },
  { make: "Toyota", models: ["Aygo", "Yaris", "Corolla", "Auris", "Avensis", "C-HR", "RAV4", "Camry"] },
  { make: "Ford", models: ["Ka", "Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "C-Max", "S-Max", "Galaxy", "Transit"] },
  { make: "Hyundai", models: ["i10", "i20", "i30", "i40", "Accent", "Tucson", "Santa Fe", "Kona", "ix35"] },
  { make: "Kia", models: ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Stonic", "Venga", "Soul"] },
  { make: "Nissan", models: ["Micra", "Note", "Qashqai", "X-Trail", "Juke", "Primera", "Almera"] },
  { make: "Mazda", models: ["2", "3", "5", "6", "CX-3", "CX-30", "CX-5"] },
  { make: "Honda", models: ["Civic", "Accord", "CR-V", "Jazz", "HR-V"] },
  { make: "Seat", models: ["Ibiza", "Leon", "Arona", "Ateca", "Toledo", "Alhambra", "Cordoba"] },
  { make: "Dacia", models: ["Sandero", "Logan", "Duster", "Lodgy", "Dokker", "Spring"] },
  { make: "Volvo", models: ["V40", "V60", "V70", "S60", "S80", "XC40", "XC60", "XC90"] },
  { make: "Suzuki", models: ["Swift", "Vitara", "SX4", "Ignis", "Baleno", "Jimny"] },
  { make: "Mitsubishi", models: ["Colt", "Lancer", "Outlander", "ASX", "Pajero"] },
  { make: "Alfa Romeo", models: ["Giulietta", "Giulia", "147", "156", "159", "Mito", "Stelvio"] },
  { make: "Jeep", models: ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler"] },
  { make: "Mini", models: ["Cooper", "One", "Countryman", "Clubman"] },
  { make: "Chevrolet", models: ["Spark", "Aveo", "Cruze", "Captiva", "Lacetti", "Kalos"] },
  { make: "Lada", models: ["Niva", "Samara", "110", "Granta"] },
  { make: "Smart", models: ["ForTwo", "ForFour"] },
];

const currentYear = new Date().getFullYear();
export const VEHICLE_YEARS: number[] = Array.from(
  { length: currentYear + 1 - 1995 + 1 },
  (_, i) => currentYear + 1 - i,
);
