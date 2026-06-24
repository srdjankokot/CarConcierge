import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput } from "../lib/validation";
import { cancelRequestSchema } from "../lib/requestValidation";

const CLIENT_CANCELABLE = ["CREATED", "OFFER_SENT", "CONFIRMED", "DRIVER_ASSIGNED"];

// Callable — klijent otkazuje SVOJ zahtev, dozvoljeno samo do DRIVER_ASSIGNED.
export const cancelRequest = onCall({ region: REGION }, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Prijava je obavezna.");
  }
  const { requestId, reason } = parseInput(cancelRequestSchema, req.data);
  const ref = db.doc(`requests/${requestId}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Zahtev ne postoji.");
    }
    const data = snap.data()!;
    if (data.clientId !== req.auth!.uid) {
      throw new HttpsError("permission-denied", "Ovo nije vaš zahtev.");
    }
    if (!CLIENT_CANCELABLE.includes(data.status)) {
      throw new HttpsError("failed-precondition", "Zahtev se u ovoj fazi više ne može otkazati.");
    }
    if (reason && reason.trim()) {
      tx.set(ref.collection("events").doc(), {
        role: "client",
        name: data.clientName ?? "",
        text: reason.trim(),
        kind: "cancel",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(ref, {
      status: "CANCELLED",
      cancelledBy: "client",
      cancelReason: reason ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true as const };
});
