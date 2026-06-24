import * as functionsV1 from "firebase-functions/v1";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db, REGION } from "../lib/admin";

// Auth onCreate (1. gen) — podrazumevani provisioning svakog novog naloga kao
// klijenta. Defer-uje eksplicitnom provisioning-u (createDriver/createDispatcher/
// completeClientRegistration): preskače ako profil ili claim već postoje.
export const onUserCreate = functionsV1
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const ref = db.doc(`users/${user.uid}`);
    const [snap, record] = await Promise.all([ref.get(), adminAuth.getUser(user.uid)]);
    const existing = snap.data() ?? {};

    // Default uloga 'client' samo ako još nijedna nije dodeljena (ne gazi seed/createDriver).
    if (!record.customClaims?.role) {
      await adminAuth.setCustomUserClaims(user.uid, { role: "client" });
    }

    // Idempotentno dopuni osnovna polja koja nedostaju; NIKAD ne diraj postojeću ulogu.
    const patch: Record<string, unknown> = {};
    if (existing.role === undefined) patch.role = record.customClaims?.role ?? "client";
    if (existing.email === undefined) patch.email = user.email ?? "";
    if (existing.fullName === undefined) patch.fullName = user.displayName ?? "";
    if (existing.phone === undefined) patch.phone = user.phoneNumber ?? "";
    if (existing.fcmTokens === undefined) patch.fcmTokens = [];
    if (existing.createdAt === undefined) patch.createdAt = FieldValue.serverTimestamp();
    if (Object.keys(patch).length > 0) {
      await ref.set(patch, { merge: true });
    }
  });
