"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const NAV: Record<Role, { href: string; label: string }[]> = {
  client: [
    { href: "/home", label: "Početna" },
    { href: "/new", label: "Novi zahtev" },
    { href: "/vehicles", label: "Vozila" },
    { href: "/servicers", label: "Serviseri" },
  ],
  dispatcher: [
    { href: "/board", label: "Tabla" },
    { href: "/partners", label: "Partneri" },
    { href: "/drivers", label: "Vozači" },
  ],
  driver: [{ href: "/jobs", label: "Poslovi" }],
};

export function AppHeader() {
  const { profile, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const links = role ? NAV[role] : [];

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-bg/85 backdrop-blur">
      {/* Akcentna traka — boja po ulozi, trenutni vizuelni signal gde si. */}
      <div className="h-1 w-full bg-accent" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3">
          <span className="brand-mark">A</span>
          <span className="font-display text-[17px] font-bold tracking-tight">Auto Concierge</span>
          {role ? <RoleBadge role={role} /> : null}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationsBell />
          {profile ? (
            <span className="hidden text-sm text-text-dim sm:inline">
              {profile.fullName || profile.email}
            </span>
          ) : null}
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="text-sm text-text-dim transition-colors hover:text-text disabled:opacity-50"
          >
            Odjava
          </button>
        </div>
      </div>

      {links.length > 0 ? (
        <nav className="mx-auto max-w-6xl px-5">
          <div className="flex gap-1 overflow-x-auto">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "border-accent text-text"
                      : "border-transparent text-text-dim hover:text-text",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
