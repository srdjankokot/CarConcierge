import { z } from "zod";

/** Uklanja razmake, crtice i zagrade iz unetog telefona. */
export function normalizePhone(input: string): string {
  return input.replace(/[\s\-()]/g, "");
}

// Srpski mobilni: 06x + 7–8 cifara, ili +3816x + 7–8 cifara (sekcija 11A).
const phoneRegex = /^(\+381|0)6\d{7,8}$/;

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Ime mora imati bar 2 karaktera")
  .max(60, "Ime može imati najviše 60 karaktera");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email je obavezan")
  .email("Unesite ispravan email");

export const phoneSchema = z
  .string()
  .min(1, "Telefon je obavezan")
  .transform(normalizePhone)
  .refine((v) => phoneRegex.test(v), "Unesite ispravan broj (npr. 06x xxx xxxx)");

export const passwordSchema = z
  .string()
  .min(8, "Lozinka mora imati bar 8 karaktera");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Lozinka je obavezna"),
});

export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

// Dispečer kreira vozača/dispečera. Lozinka je opciona — ako se izostavi,
// Cloud Function generiše privremenu i vraća je dispečeru.
export const createUserSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, "Lozinka mora imati bar 8 karaktera"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
