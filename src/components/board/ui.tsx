import type { CSSProperties } from "react";
import type { RequestStatus } from "@/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { statusColor, statusKind, statusLabel } from "@/lib/board/model";

export function StatusDot({ status }: { status: RequestStatus }) {
  const c = statusColor(status);
  const live = statusKind(status) === "live";
  return (
    <span
      className={live ? "rd-pulse" : ""}
      style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}`, flexShrink: 0, display: "inline-block" }}
    />
  );
}

export function StatusPill({ status }: { status: RequestStatus }) {
  const c = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        padding: "4px 10px",
        borderRadius: 999,
        color: c,
        background: `color-mix(in srgb, ${c} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} 32%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      <StatusDot status={status} />
      {statusLabel(status)}
    </span>
  );
}

export function VWell({ icon, size = 44 }: { icon: IconName; size?: number }) {
  return (
    <span
      style={{ width: size, height: size, borderRadius: 13, display: "grid", placeItems: "center", color: "var(--brass)", background: "rgba(201,168,106,0.11)", border: "1px solid var(--glass-line)", flexShrink: 0 }}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} />
    </span>
  );
}

export function Meta({ icon, children, warn }: { icon: IconName; children: React.ReactNode; warn?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11.5, color: warn ? "var(--warn)" : "var(--text-faint)", whiteSpace: "nowrap" }}>
      <Icon name={icon} size={13} />
      {children}
    </span>
  );
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DriverChip({ name }: { name: string | null }) {
  if (!name) return <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 9.5, color: "#10231a", background: "var(--mint-grad)", flexShrink: 0 }}>
        {initials(name)}
      </span>
      {name}
    </span>
  );
}

export const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: 13,
  padding: "9px 15px",
  borderRadius: 11,
  border: "none",
  cursor: "pointer",
  background: "var(--brass-grad)",
  color: "#1a130a",
  boxShadow: "0 6px 18px -8px rgba(201,168,106,0.55)",
  whiteSpace: "nowrap",
};
export const ghostBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontFamily: "var(--font-body)",
  fontWeight: 500,
  fontSize: 13,
  padding: "9px 15px",
  borderRadius: 11,
  cursor: "pointer",
  color: "var(--text)",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--glass-line)",
  whiteSpace: "nowrap",
};
export const iconBtn: CSSProperties = {
  width: 38,
  height: 38,
  display: "grid",
  placeItems: "center",
  borderRadius: 11,
  cursor: "pointer",
  color: "var(--text-dim)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--glass-line)",
  flexShrink: 0,
};
