"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import type { Role } from "@/types";

const HOME_BY_ROLE: Record<Role, string> = {
  client: "/home",
  dispatcher: "/board",
  driver: "/jobs",
};

export function homePathForRole(role: Role): string {
  return HOME_BY_ROLE[role];
}

/**
 * Štiti role-grupu. Vraća `ready` kad je sigurno da prikaz pripada traženoj ulozi.
 * Pokriva auth edge slučajeve (11B): dok se claim/profil učitava → loading (ne prazno);
 * pogrešna uloga → redirect na sopstveni home (ne greška); bez sesije → login.
 */
export function useRoleGuard(required: Role): { ready: boolean; loading: boolean } {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !role) {
      router.replace("/login");
      return;
    }
    if (role !== required) {
      router.replace(HOME_BY_ROLE[role]);
    }
  }, [loading, user, role, required, router]);

  return { ready: !loading && !!user && role === required, loading };
}
