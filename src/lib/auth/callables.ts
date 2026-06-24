"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
  /** Ako se izostavi, Function generiše privremenu lozinku i vraća je. */
  password?: string;
}

export interface CreateUserResult {
  uid: string;
  /** Privremena lozinka (samo ako je server generisao) — dispečer je prosleđuje korisniku. */
  tempPassword?: string;
}

export const createDriverCallable = httpsCallable<CreateUserInput, CreateUserResult>(
  functions,
  "createDriver",
);

export const createDispatcherCallable = httpsCallable<CreateUserInput, CreateUserResult>(
  functions,
  "createDispatcher",
);

export interface CompleteClientRegistrationInput {
  fullName: string;
  phone: string;
}

// Poziva se odmah posle createUserWithEmailAndPassword: postavlja claim role:'client'
// i upisuje fullName/phone u users dokument (deterministički, ne zavisi od trigera).
export const completeClientRegistrationCallable = httpsCallable<
  CompleteClientRegistrationInput,
  { ok: true }
>(functions, "completeClientRegistration");
