import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDispatcher } from "../lib/validation";
import { closeRequestSchema } from "../lib/requestValidation";

// Callable — dispečer zatvara posao nakon isporuke. DELIVERED → CLOSED.
export const closeRequest = onCall({ region: REGION }, async (req) => {
  requireDispatcher(req);
  const { requestId } = parseInput(closeRequestSchema, req.data);
  const ref = db.doc(`requests/${requestId}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Zahtev ne postoji.");
    }
    if (snap.data()!.status !== "DELIVERED") {
      throw new HttpsError("failed-precondition", "Posao se može zatvoriti tek nakon isporuke.");
    }
    tx.update(ref, { status: "CLOSED", updatedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true as const };
});
