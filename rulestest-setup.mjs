import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
initializeApp({ credential: applicationDefault() });
const auth = getAuth(); const db = getFirestore();
const email = "ruletest-driver@test.rs";
let uid;
try { uid = (await auth.getUserByEmail(email)).uid; }
catch { uid = (await auth.createUser({ email, password: "test1234" })).uid; }
await auth.setCustomUserClaims(uid, { role: "driver" });
await db.doc(`users/${uid}`).set({ role: "driver", email, fullName: "Rule Test", phone: "060", isActive: true }, { merge: true });
const ref = await db.collection("requests").add({
  clientId: "ruletestclient", clientName: "RT", status: "DRIVER_ASSIGNED",
  assignedDriverId: uid, vehicle: { make: "T", model: "T", year: 2020 },
  pickup: { address: "x", timeWindow: { date: "2026-12-31", from: "08:00", to: "12:00" } },
  dropoff: { sameAsPickup: true, address: "x" }, services: [],
  createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
});
const ct = await auth.createCustomToken(uid);
console.log("DRIVER_UID=" + uid);
console.log("REQ_ID=" + ref.id);
console.log("CUSTOM_TOKEN=" + ct);
