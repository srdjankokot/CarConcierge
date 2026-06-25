"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { BrandMark } from "@/components/redesign/BrandMark";
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

const ROLE_LABEL: Record<Role, string> = {
  client: "Klijent",
  dispatcher: "Dispečer",
  driver: "Vozač",
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
    <header
      className="glass"
      style={{ position: "sticky", top: 14, zIndex: 50, margin: "14px auto 0", maxWidth: 1040, borderRadius: 22, padding: "0 8px" }}
    >
      <div style={{ display: "flex", height: 60, alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark size="sm" />
          <span style={{ width: 1, height: 22, background: "var(--glass-line)" }} />
          {role ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: ".6px",
                color: "var(--role-accent)",
                border: "1px solid color-mix(in srgb, var(--role-accent) 40%, transparent)",
                background: "color-mix(in srgb, var(--role-accent) 12%, transparent)",
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              {ROLE_LABEL[role]}
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NotificationsBell />
          {profile ? (
            <span className="hidden sm:inline" style={{ fontSize: 13.5, color: "var(--text-dim)" }}>
              {profile.fullName || profile.email}
            </span>
          ) : null}
          <button
            onClick={handleSignOut}
            disabled={busy}
            style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 13.5, cursor: "pointer" }}
            className="transition-colors hover:text-text disabled:opacity-50"
          >
            Odjava
          </button>
        </div>
      </div>

      {links.length > 0 ? (
        <nav style={{ display: "flex", gap: 22, padding: "0 16px", borderTop: "1px solid var(--glass-line)", overflowX: "auto" }}>
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link key={l.href} href={l.href} className={cn("rd-tab", active && "on")} style={{ whiteSpace: "nowrap" }}>
                {l.label}
                {active ? <span className="ink" /> : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
