import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDriver } from "../lib/validation";
import { addJobPhotoSchema } from "../lib/requestValidation";

const BEFORE_OK = ["DRIVER_ASSIGNED", "PICKED_UP"];
const AFTER_OK = ["RETURNING", "DELIVERED"];

// Callable — vozač upisuje URL otpremljene fotografije na zahtev (klijent/vozač ne
// pišu requests direktno). 'before' pre/oko preuzimanja, 'after' pre/oko predaje.
export const addJobPhoto = onCall({ region: REGION }, async (req) => {
  requireDriver(req);
  const { requestId, phase, url, slot } = parseInput(addJobPhotoSchema, req.data);
  const ref = db.doc(`requests/${requestId}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Posao ne postoji.");
    }
    const cur = snap.data()!;
    if (cur.assignedDriverId !== req.auth!.uid) {
      throw new HttpsError("permission-denied", "Niste dodeljeni na ovaj posao.");
    }
    const allowed = phase === "before" ? BEFORE_OK : AFTER_OK;
    if (!allowed.includes(cur.status)) {
      throw new HttpsError("failed-precondition", "Fotografije nije moguće dodati u ovoj fazi.");
    }
    const field = phase === "before" ? "photosBefore" : "photosAfter";
    const photo = slot ? { url, slot } : { url };
    tx.update(ref, { [field]: FieldValue.arrayUnion(photo), updatedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true as const };
});
