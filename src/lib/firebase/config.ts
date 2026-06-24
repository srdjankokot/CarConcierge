// Firebase Web App konfiguracija — čita se iz NEXT_PUBLIC_* env varijabli.
// Vrednosti popuni u .env.local (vidi .env.local.example).
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Mora se poklapati sa regionom u functions/src (setGlobalOptions).
export const FUNCTIONS_REGION =
  process.env.NEXT_PUBLIC_FUNCTIONS_REGION || "europe-west1";

export const USE_EMULATORS =
  process.env.NEXT_PUBLIC_USE_EMULATORS === "true";
