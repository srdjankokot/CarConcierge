"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { homePathForRole } from "@/lib/auth/useRoleGuard";
import { FullScreenLoader } from "@/components/ui/Spinner";

// Ulazna tačka: preusmerava na login ili na home odgovarajuće uloge.
export default function RootPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !role) {
      router.replace("/login");
      return;
    }
    router.replace(homePathForRole(role));
  }, [user, role, loading, router]);

  return <FullScreenLoader label="Učitavanje…" />;
}
