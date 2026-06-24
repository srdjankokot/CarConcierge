import { randomUUID } from "crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput } from "../lib/validation";
import { createRequestSchema } from "../lib/requestValidation";

// Callable — samo klijent. Validira i gradi zahtev server-side (status CREATED).
export const createRequest = onCall({ region: REGION }, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Prijava je obavezna.");
  }
  if (req.auth.token.role !== "client") {
    throw new HttpsError("permission-denied", "Samo klijent može da kreira zahtev.");
  }

  const data = parseInput(createRequestSchema, req.data);

  const services = data.services.map((s) => ({
    id: randomUUID(),
    type: s.type,
    label: s.label,
    servicerChoice: s.servicerChoice,
    ownServicer: s.servicerChoice === "own" ? s.ownServicer : undefined,
    itemStatus: "pending" as const,
  }));

  const dropoffAddress = data.dropoff.sameAsPickup ? data.pickup.address : data.dropoff.address;

  // Snapshot kontakta klijenta (dispečer ga vidi bez dodatnog čitanja).
  const profile = (await db.doc(`users/${req.auth.uid}`).get()).data();

  const ref = await db.collection("requests").add({
    clientId: req.auth.uid,
    clientName: profile?.fullName ?? "",
    clientPhone: profile?.phone ?? "",
    status: "CREATED",
    vehicle: data.vehicle,
    pickup: { address: data.pickup.address, timeWindow: data.pickup.timeWindow },
    dropoff: { sameAsPickup: data.dropoff.sameAsPickup, address: dropoffAddress },
    services,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { requestId: ref.id };
});
