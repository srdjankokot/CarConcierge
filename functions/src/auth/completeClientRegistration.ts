import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db, REGION } from "../lib/admin";
import { completeClientSchema, parseInput } from "../lib/validation";

// Poziva se odmah posle registracije email+lozinkom. Deterministički postavlja
// claim role:'client' i upisuje fullName/phone (ne oslanja se na tajming trigera).
export const completeClientRegistration = onCall({ region: REGION }, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Prijava je obavezna.");
  }
  const { fullName, phone } = parseInput(completeClientSchema, req.data);
  const uid = req.auth.uid;

  // Ne dozvoli da nalog koji je već dispečer/vozač promeni profil ovim putem.
  const record = await adminAuth.getUser(uid);
  const currentRole = record.customClaims?.role;
  if (currentRole && currentRole !== "client") {
    throw new HttpsError("failed-precondition", "Nalog već ima dodeljenu ulogu.");
  }

  await adminAuth.setCustomUserClaims(uid, { role: "client" });
  await db.doc(`users/${uid}`).set(
    {
      role: "client",
      email: req.auth.token.email ?? record.email ?? "",
      fullName,
      phone,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true as const };
});
