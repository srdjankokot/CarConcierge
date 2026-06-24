import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db, REGION } from "../lib/admin";
import { createUserSchema, generatePassword, parseInput, requireDispatcher } from "../lib/validation";

// Callable — samo dispečer. Kreira dodatne dispečerske naloge (isti obrazac kao createDriver).
export const createDispatcher = onCall({ region: REGION }, async (req) => {
  requireDispatcher(req);
  const { fullName, email, phone, password } = parseInput(createUserSchema, req.data);
  const tempPassword = password ?? generatePassword();

  let userRecord;
  try {
    userRecord = await adminAuth.createUser({ email, password: tempPassword, displayName: fullName });
  } catch (e) {
    if ((e as { code?: string }).code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Korisnik sa ovim email-om već postoji.");
    }
    throw e;
  }

  await db.doc(`users/${userRecord.uid}`).set({
    role: "dispatcher",
    email,
    fullName,
    phone,
    fcmTokens: [],
    createdAt: FieldValue.serverTimestamp(),
  });
  await adminAuth.setCustomUserClaims(userRecord.uid, { role: "dispatcher" });

  return { uid: userRecord.uid, tempPassword: password ? undefined : tempPassword };
});
