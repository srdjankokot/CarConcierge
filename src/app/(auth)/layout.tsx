"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { homePathForRole } from "@/lib/auth/useRoleGuard";
import { FullScreenLoader } from "@/components/ui/Spinner";

// Javne rute (login/register). Ako je korisnik već prijavljen → na njegov home.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && role) {
      router.replace(homePathForRole(role));
    }
  }, [user, role, loading, router]);

  if (loading || (user && role)) {
    return <FullScreenLoader label="Učitavanje…" />;
  }

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>{children}</div>
  );
}
