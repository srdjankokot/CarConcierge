import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDispatcher } from "../lib/validation";
import { setItemStatusSchema } from "../lib/requestValidation";

interface ServiceItemDoc {
  id: string;
  itemStatus?: string;
  [k: string]: unknown;
}

// Callable — dispečer ručno vodi status partnera po stavci (pending/at_servicer/done).
export const setItemStatus = onCall({ region: REGION }, async (req) => {
  requireDispatcher(req);
  const { requestId, itemId, itemStatus } = parseInput(setItemStatusSchema, req.data);
  const ref = db.doc(`requests/${requestId}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Zahtev ne postoji.");
    }
    const services = (snap.data()!.services ?? []) as ServiceItemDoc[];
    const idx = services.findIndex((s) => s.id === itemId);
    if (idx === -1) {
      throw new HttpsError("invalid-argument", "Stavka ne postoji.");
    }
    services[idx] = { ...services[idx], itemStatus };
    tx.update(ref, { services, updatedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true as const };
});
