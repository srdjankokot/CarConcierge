"use client";

import { type ReactNode } from "react";
import { useRoleGuard } from "@/lib/auth/useRoleGuard";
import { FullScreenLoader } from "@/components/ui/Spinner";
import { AppHeader } from "@/components/layout/AppHeader";
import type { Role } from "@/types";

// Štiti role-grupu, postavlja data-role (→ --role-accent) i renderuje zaglavlje.
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, loading } = useRoleGuard(role);

  if (!ready) {
    return <FullScreenLoader label={loading ? "Učitavanje…" : "Preusmeravanje…"} />;
  }

  return (
    <div data-role={role} className="min-h-[100dvh]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
