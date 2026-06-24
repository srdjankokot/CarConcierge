/**
 * Bootstrap prvog dispečera (sekcija 3A). Pokreće se lokalno jednom.
 *
 * Preduslov: GOOGLE_APPLICATION_CREDENTIALS pokazuje na service account JSON
 * (Firebase Console → Project settings → Service accounts → Generate new private key).
 * Ključ drži IZVAN repo-a.
 *
 * Postupak:
 *   1) napravi nalog kroz registraciju u aplikaciji
 *   2) iskopiraj njegov uid iz Firebase konzole (Authentication)
 *   3) npm run seed:admin -- <uid> dispatcher
 *   4) korisnik se odjavi i ponovo prijavi (da novi claim uđe u token)
 */
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const VALID_ROLES = ["dispatcher", "driver", "client"] as const;
type SeedRole = (typeof VALID_ROLES)[number];

async function main(): Promise<void> {
  const uid = process.argv[2];
  const role = (process.argv[3] ?? "dispatcher") as SeedRole;

  if (!uid) {
    console.error("Upotreba: npm run seed:admin -- <uid> [dispatcher|driver|client]");
    process.exit(1);
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Nevažeća uloga: "${role}". Dozvoljeno: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  // U emulator režimu kredencijali nisu potrebni (Admin SDK se kači na emulatore
  // preko FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST).
  const useEmulator = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );
  if (!getApps().length) {
    initializeApp(
      useEmulator
        ? { projectId: process.env.GCLOUD_PROJECT ?? "demo-autoconcierge" }
        : { credential: applicationDefault() },
    );
  }

  const auth = getAuth();
  const db = getFirestore();

  await auth.setCustomUserClaims(uid, { role });
  await db.doc(`users/${uid}`).set({ role }, { merge: true });

  console.log(`✓ Postavljena uloga "${role}" za ${uid}.`);
  console.log("Korisnik se mora odjaviti i ponovo prijaviti da bi novi claim ušao u token.");
}

main().catch((err) => {
  console.error("Greška:", err);
  process.exit(1);
});
