import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { FUNCTIONS_REGION, USE_EMULATORS, firebaseConfig } from "./config";

// Singleton — izbegava re-init na Fast Refresh / SSR.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, FUNCTIONS_REGION);

// Emulator Suite — samo u browseru i samo jednom.
declare global {
  // eslint-disable-next-line no-var
  var __AC_EMULATORS_CONNECTED__: boolean | undefined;
}

if (USE_EMULATORS && typeof window !== "undefined" && !globalThis.__AC_EMULATORS_CONNECTED__) {
  globalThis.__AC_EMULATORS_CONNECTED__ = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export { app };
