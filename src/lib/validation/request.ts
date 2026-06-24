import { z } from "zod";

const currentYear = new Date().getFullYear();

export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// CRUD: sačuvano vozilo (sekcija 11A)
export const vehicleSchema = z.object({
  make: z.string().trim().min(1, "Marka je obavezna").max(40),
  model: z.string().trim().min(1, "Model je obavezan").max(40),
  year: z.coerce
    .number({ invalid_type_error: "Godište mora biti broj" })
    .int()
    .min(1950, "Najmanje 1950")
    .max(currentYear + 1, `Najviše ${currentYear + 1}`),
  plate: z.string().trim().max(20).optional().or(z.literal("")),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

// CRUD: sačuvani serviser
export const servicerSchema = z.object({
  name: z.string().trim().min(2, "Naziv je obavezan").max(60),
  address: z.string().trim().min(5, "Min 5 karaktera").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});
export type ServicerInput = z.infer<typeof servicerSchema>;

// ─── Kreiranje zahteva ───────────────────────────────────────────────────────
const ownServicerInput = z.object({
  servicerId: z.string().optional(),
  name: z.string().trim().min(2, "Naziv servisera je obavezan").max(60),
  address: z.string().trim().min(5, "Adresa servisera je obavezna").max(120),
  phone: z.string().trim().max(30).optional(),
});

export const serviceItemInputSchema = z
  .object({
    type: z.enum(["service", "technical", "registration", "tires", "wash", "other"]),
    label: z.string().trim().max(60).optional(),
    servicerChoice: z.enum(["suggest", "own"]),
    ownServicer: ownServicerInput.optional(),
  })
  .refine((s) => s.servicerChoice !== "own" || !!s.ownServicer, {
    message: "Za 'moj serviser' unesite naziv i adresu.",
    path: ["ownServicer"],
  });

const timeWindowInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Izaberite datum"),
    from: z.string().regex(/^\d{2}:\d{2}$/, "Izaberite vreme"),
    to: z.string().regex(/^\d{2}:\d{2}$/, "Izaberite vreme"),
  })
  .refine((t) => t.from < t.to, { message: "'Od' mora biti pre 'do'.", path: ["to"] })
  .refine((t) => t.date >= todayStr(), {
    message: "Datum ne može biti u prošlosti.",
    path: ["date"],
  });

export const createRequestInputSchema = z.object({
  vehicle: z.object({
    vehicleId: z.string().optional(),
    make: z.string().trim().min(1).max(40),
    model: z.string().trim().min(1).max(40),
    year: z.number().int().min(1950).max(currentYear + 1),
    plate: z.string().trim().max(20).optional(),
  }),
  services: z.array(serviceItemInputSchema).min(1, "Dodajte bar jednu uslugu."),
  pickup: z.object({
    address: z.string().trim().min(5, "Adresa preuzimanja je obavezna").max(160),
    timeWindow: timeWindowInputSchema,
  }),
  dropoff: z
    .object({ sameAsPickup: z.boolean(), address: z.string().trim().max(160).optional() })
    .refine((d) => d.sameAsPickup || (!!d.address && d.address.length >= 5), {
      message: "Unesite adresu vraćanja.",
      path: ["address"],
    }),
});

export type CreateRequestInput = z.infer<typeof createRequestInputSchema>;
