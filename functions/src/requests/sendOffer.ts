import { randomUUID } from "crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDispatcher } from "../lib/validation";
import { sendOfferSchema } from "../lib/requestValidation";

// Callable — dispečer sastavlja i šalje ponudu. Dozvoljeno samo dok je status CREATED
// (ili vraćen na CREATED nakon "traži izmenu"). Postavlja partnere za 'suggest' stavke,
// dozvoljava izmenu stavki, upisuje termin/cenu → OFFER_SENT.
export const sendOffer = onCall({ region: REGION }, async (req) => {
  requireDispatcher(req);
  const data = parseInput(sendOfferSchema, req.data);
  const ref = db.doc(`requests/${data.requestId}`);

  const services = data.services.map((s) => ({
    id: s.id ?? randomUUID(),
    type: s.type,
    label: s.label,
    servicerChoice: s.servicerChoice,
    ownServicer: s.servicerChoice === "own" ? s.ownServicer : undefined,
    partnerRef: s.servicerChoice === "suggest" ? s.partnerRef : undefined,
    itemStatus: "pending" as const,
  }));

  const dispatcherName = (await db.doc(`users/${req.auth!.uid}`).get()).data()?.fullName ?? "";

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Zahtev ne postoji.");
    }
    if (snap.data()!.status !== "CREATED") {
      throw new HttpsError("failed-precondition", "Ponuda se može poslati samo dok je zahtev nov.");
    }
    if (data.note && data.note.trim()) {
      tx.set(ref.collection("events").doc(), {
        role: "dispatcher",
        name: dispatcherName,
        text: data.note.trim(),
        kind: "offer",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(ref, {
      services,
      offer: {
        proposedTime: data.proposedTime,
        transportPrice: data.transportPrice,
        note: data.note,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: req.auth!.uid,
      },
      offerRespondedAt: FieldValue.delete(),
      rejectionReason: FieldValue.delete(),
      changeRequestNote: FieldValue.delete(),
      status: "OFFER_SENT",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true as const };
});
