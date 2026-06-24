import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput } from "../lib/validation";
import { respondToOfferSchema } from "../lib/requestValidation";

const NEXT_STATUS = {
  accept: "CONFIRMED",
  reject: "REJECTED",
  request_change: "CREATED",
} as const;

// Callable — klijent odgovara na ponudu (Prihvati / Odbij / Traži izmenu).
// Dozvoljeno samo dok je status OFFER_SENT (sprečava akciju na zastareloj ponudi).
export const respondToOffer = onCall({ region: REGION }, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Prijava je obavezna.");
  }
  const { requestId, action, reason } = parseInput(respondToOfferSchema, req.data);
  const ref = db.doc(`requests/${requestId}`);

  const nextStatus = NEXT_STATUS[action];

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Zahtev ne postoji.");
    }
    const data = snap.data()!;
    if (data.clientId !== req.auth!.uid) {
      throw new HttpsError("permission-denied", "Ovo nije vaš zahtev.");
    }
    if (data.status !== "OFFER_SENT") {
      throw new HttpsError("failed-precondition", "Ponuda više nije aktivna.");
    }
    if ((action === "reject" || action === "request_change") && reason && reason.trim()) {
      tx.set(ref.collection("events").doc(), {
        role: "client",
        name: data.clientName ?? "",
        text: reason.trim(),
        kind: action === "reject" ? "rejection" : "change_request",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(ref, {
      status: nextStatus,
      offerRespondedAt: FieldValue.serverTimestamp(),
      rejectionReason: action === "reject" ? (reason ?? "") : FieldValue.delete(),
      changeRequestNote: action === "request_change" ? (reason ?? "") : FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true as const, status: nextStatus };
});
