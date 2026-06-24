import { z } from "zod";

// Partner u mreži (CRUD vodi dispečer).
export const partnerSchema = z.object({
  name: z.string().trim().min(2, "Naziv je obavezan").max(60),
  address: z.string().trim().min(5, "Min 5 karaktera").max(120),
  phone: z.string().trim().min(1, "Telefon je obavezan").max(30),
  serviceTypes: z
    .array(z.enum(["service", "technical", "registration", "tires", "wash", "other"]))
    .min(1, "Izaberite bar jedan tip usluge"),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export type PartnerInput = z.infer<typeof partnerSchema>;
