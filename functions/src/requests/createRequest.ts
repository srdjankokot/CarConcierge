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

  // pickup/dropoff sa koordinatama (izostavi undefined — Firestore ga ne prima).
  const pickup: { address: string; lat?: number; lng?: number; timeWindow: typeof data.pickup.timeWindow } = {
    address: data.pickup.address,
    timeWindow: data.pickup.timeWindow,
  };
  if (typeof data.pickup.lat === "number") pickup.lat = data.pickup.lat;
  if (typeof data.pickup.lng === "number") pickup.lng = data.pickup.lng;

  const dropoff: { sameAsPickup: boolean; address: string; lat?: number; lng?: number } = {
    sameAsPickup: data.dropoff.sameAsPickup,
    address: dropoffAddress ?? data.pickup.address,
  };
  const dropLat = data.dropoff.sameAsPickup ? data.pickup.lat : data.dropoff.lat;
  const dropLng = data.dropoff.sameAsPickup ? data.pickup.lng : data.dropoff.lng;
  if (typeof dropLat === "number") dropoff.lat = dropLat;
  if (typeof dropLng === "number") dropoff.lng = dropLng;

  // Snapshot kontakta klijenta (dispečer ga vidi bez dodatnog čitanja).
  const profile = (await db.doc(`users/${req.auth.uid}`).get()).data();

  const ref = await db.collection("requests").add({
    clientId: req.auth.uid,
    clientName: profile?.fullName ?? "",
    clientPhone: profile?.phone ?? "",
    status: "CREATED",
    vehicle: data.vehicle,
    pickup,
    dropoff,
    services,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { requestId: ref.id };
});
