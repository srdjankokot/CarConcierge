import { HttpsError, onCall } from "firebase-functions/v2/https";
import { adminAuth, db, REGION } from "../lib/admin";

// Callable — svako sme da uskladi SVOJ custom claim sa ulogom iz users dokumenta.
// Popravlja slučaj kad je users.role promenjen (npr. seed/ručno), a claim ostao stari,
// pa Firestore pravila (koja gledaju claim) odbijaju dispečerske/vozačke upise.
export const resyncMyRole = onCall({ region: REGION }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Prijava je obavezna.");
  const role = (await db.doc(`users/${uid}`).get()).data()?.role;
  if (role !== "client" && role !== "dispatcher" && role !== "driver") {
    throw new HttpsError("failed-precondition", "Nepoznata uloga u profilu.");
  }
  await adminAuth.setCustomUserClaims(uid, { role });
  return { role };
});
