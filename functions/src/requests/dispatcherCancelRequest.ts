import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDispatcher } from "../lib/validation";
import { cancelRequestSchema } from "../lib/requestValidation";

// Dispečer može da otkaže aktivan posao (uključujući posle DRIVER_ASSIGNED — sekcija 5).
const DISPATCHER_CANCELABLE = [
  "CREATED",
  "OFFER_SENT",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "AT_SERVICE",
  "SERVICE_DONE",
  "RETURNING",
];

export const dispatcherCancelRequest = onCall({ region: REGION }, async (req) => {
  requireDispatcher(req);
  const { requestId, reason } = parseInput(cancelRequestSchema, req.data);
  const ref = db.doc(`requests/${requestId}`);
  const name = (await db.doc(`users/${req.auth!.uid}`).get()).data()?.fullName ?? "";

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Zahtev ne postoji.");
    }
    if (!DISPATCHER_CANCELABLE.includes(snap.data()!.status)) {
      throw new HttpsError("failed-precondition", "Zahtev se u ovoj fazi ne može otkazati.");
    }
    if (reason && reason.trim()) {
      tx.set(ref.collection("events").doc(), {
        role: "dispatcher",
        name,
        text: reason.trim(),
        kind: "cancel",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(ref, {
      status: "CANCELLED",
      cancelledBy: "dispatcher",
      cancelReason: reason ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true as const };
});
