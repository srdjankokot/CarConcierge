import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDriver } from "../lib/validation";
import { advanceJobStatusSchema } from "../lib/requestValidation";

// Dozvoljeni prelazi vozača (sa → na).
const DRIVER_NEXT: Record<string, string> = {
  DRIVER_ASSIGNED: "PICKED_UP",
  PICKED_UP: "AT_SERVICE",
  AT_SERVICE: "SERVICE_DONE",
  SERVICE_DONE: "RETURNING",
  RETURNING: "DELIVERED",
};

// Callable — vozač pomera posao kroz statuse. PICKED_UP/DELIVERED zahtevaju foto
// (sekcija 5 + 10): prelaz se ne potvrđuje dok bar jedna slika nije otpremljena.
export const advanceJobStatus = onCall({ region: REGION }, async (req) => {
  requireDriver(req);
  const { requestId, toStatus } = parseInput(advanceJobStatusSchema, req.data);
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
    if (DRIVER_NEXT[cur.status] !== toStatus) {
      throw new HttpsError("failed-precondition", "Nedozvoljen prelaz statusa.");
    }
    if (toStatus === "PICKED_UP" && !(cur.photosBefore?.length > 0)) {
      throw new HttpsError("failed-precondition", "Dodajte bar jednu fotografiju pre preuzimanja.");
    }
    if (toStatus === "DELIVERED" && !(cur.photosAfter?.length > 0)) {
      throw new HttpsError("failed-precondition", "Dodajte bar jednu fotografiju pre predaje.");
    }
    tx.update(ref, { status: toStatus, updatedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true as const, status: toStatus };
});
