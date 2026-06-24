"use client";

import { getToken, isSupported } from "firebase/messaging";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { firebaseConfig } from "@/lib/firebase/config";

const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Push se nudi samo ako je VAPID ključ podešen (lokalno/emulator je obično isključen).
export const PUSH_CONFIGURED = Boolean(VAPID);

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export async function enablePush(uid: string): Promise<{ ok: boolean; reason?: string }> {
  if (!VAPID) return { ok: false, reason: "Push nije podešen (nedostaje VAPID ključ)." };
  if (!(await isPushSupported())) return { ok: false, reason: "Push nije podržan u ovom browseru." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "Dozvola za obaveštenja nije data." };

  // SW dobija Firebase config kroz query string (bez hardkodovanja u fajlu).
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? "",
    authDomain: firebaseConfig.authDomain ?? "",
    projectId: firebaseConfig.projectId ?? "",
    messagingSenderId: firebaseConfig.messagingSenderId ?? "",
    appId: firebaseConfig.appId ?? "",
  });
  const swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`);

  const { getMessaging } = await import("firebase/messaging");
  const token = await getToken(getMessaging(), { vapidKey: VAPID, serviceWorkerRegistration: swReg });
  if (!token) return { ok: false, reason: "Nije moguće dobiti token za obaveštenja." };

  await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });
  return { ok: true };
}
