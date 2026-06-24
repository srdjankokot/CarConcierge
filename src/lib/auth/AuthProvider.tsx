"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Role, UserProfile } from "@/types";

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  /** Forsira osvežavanje ID tokena (npr. nakon promene custom claim-a). */
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Koliko čekamo da onUserCreate kreira users/{uid} dokument pre nego što
// odustanemo od „provisioning" stanja (sekcija 11B — ne ostavljamo spinner zauvek).
const PROVISION_TIMEOUT_MS = 15000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [provisionTimedOut, setProvisionTimedOut] = useState(false);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;
    let provisionTimer: ReturnType<typeof setTimeout> | undefined;

    const clearProvisionTimer = () => {
      if (provisionTimer) {
        clearTimeout(provisionTimer);
        provisionTimer = undefined;
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubDoc?.();
      clearProvisionTimer();
      setProvisionTimedOut(false);
      setUser(nextUser);
      setInitializing(false);

      if (!nextUser) {
        setProfile(null);
        return;
      }

      // Čekamo users/{uid} dokument (kreira ga onUserCreate Cloud Function).
      setProfile(null);
      provisionTimer = setTimeout(() => setProvisionTimedOut(true), PROVISION_TIMEOUT_MS);

      unsubDoc = onSnapshot(
        doc(db, "users", nextUser.uid),
        async (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as Omit<UserProfile, "uid">;
          // Auto-heal: ako custom claim u tokenu ne prati ulogu iz dokumenta
          // (npr. dispečer/vozač dodeljen posle prijave), osveži token — inače
          // sigurnosna pravila i dalje vide staru ulogu.
          try {
            const res = await auth.currentUser?.getIdTokenResult();
            if (res && res.claims.role !== data.role) {
              await auth.currentUser?.getIdToken(true);
            }
          } catch {
            /* ignore */
          }
          clearProvisionTimer();
          setProvisionTimedOut(false);
          setProfile({ uid: snap.id, ...data });
        },
        (err) => {
          console.error("[auth] users doc listener error", err);
          clearProvisionTimer();
          setProvisionTimedOut(true);
        },
      );
    });

    return () => {
      unsubDoc?.();
      clearProvisionTimer();
      unsubAuth();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = profile?.role ?? null;
    const loading = initializing || (user !== null && profile === null && !provisionTimedOut);
    return {
      user,
      profile,
      role,
      loading,
      refreshToken: async () => {
        if (auth.currentUser) await auth.currentUser.getIdToken(true);
      },
    };
  }, [user, profile, initializing, provisionTimedOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
