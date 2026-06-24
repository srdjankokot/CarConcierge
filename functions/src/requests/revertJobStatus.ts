import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDriver } from "../lib/validation";
import { revertJobStatusSchema } from "../lib/requestValidation";

// Prethodni status u vozačevom toku (ispravka greške).
const DRIVER_PREV: Record<string, string> = {
  PICKED_UP: "DRIVER_ASSIGNED",
  AT_SERVICE: "PICKED_UP",
  SERVICE_DONE: "AT_SERVICE",
  RETURNING: "SERVICE_DONE",
  DELIVERED: "RETURNING",
};

// Callable — vozač vraća posao na prethodni status (dok dispečer ne zatvori posao).
export const revertJobStatus = onCall({ region: REGION }, async (req) => {
  requireDriver(req);
  const { requestId } = parseInput(revertJobStatusSchema, req.data);
  const ref = db.doc(`requests/${requestId}`);

  let prev = "";
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Posao ne postoji.");
    }
    const cur = snap.data()!;
    if (cur.assignedDriverId !== req.auth!.uid) {
      throw new HttpsError("permission-denied", "Niste dodeljeni na ovaj posao.");
    }
    prev = DRIVER_PREV[cur.status];
    if (!prev) {
      throw new HttpsError("failed-precondition", "Status nije moguće vratiti.");
    }
    tx.update(ref, { status: prev, updatedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true as const, status: prev };
});
