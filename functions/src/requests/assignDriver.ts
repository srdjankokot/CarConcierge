import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, REGION } from "../lib/admin";
import { parseInput, requireDispatcher } from "../lib/validation";
import { assignDriverSchema } from "../lib/requestValidation";

// Callable — dispečer dodeljuje vozača. Transakcija sprečava dvostruku dodelu (11B).
// Upisuje snapshot kontakta vozača (klijent ne čita users/{driverId}). CONFIRMED → DRIVER_ASSIGNED.
export const assignDriver = onCall({ region: REGION }, async (req) => {
  requireDispatcher(req);
  const { requestId, driverId } = parseInput(assignDriverSchema, req.data);

  const driverSnap = await db.doc(`users/${driverId}`).get();
  if (!driverSnap.exists) {
    throw new HttpsError("not-found", "Vozač ne postoji.");
  }
  const driver = driverSnap.data()!;
  if (driver.role !== "driver") {
    throw new HttpsError("failed-precondition", "Izabrani nalog nije vozač.");
  }
  if (driver.isActive === false) {
    throw new HttpsError("failed-precondition", "Vozač trenutno nije aktivan.");
  }

  const ref = db.doc(`requests/${requestId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Zahtev ne postoji.");
    }
    const cur = snap.data()!;
    if (cur.status !== "CONFIRMED") {
      throw new HttpsError(
        "failed-precondition",
        "Vozač se dodeljuje tek kad klijent potvrdi ponudu.",
      );
    }
    if (cur.assignedDriverId) {
      throw new HttpsError("failed-precondition", "Posao je već dodeljen vozaču.");
    }
    tx.update(ref, {
      assignedDriverId: driverId,
      assignedDriver: { name: driver.fullName ?? "", phone: driver.phone ?? "" },
      assignedAt: FieldValue.serverTimestamp(),
      status: "DRIVER_ASSIGNED",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true as const };
});
