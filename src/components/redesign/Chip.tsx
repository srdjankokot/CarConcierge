import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        padding: "5px 11px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid var(--glass-line)",
        color: "var(--text-dim)",
      }}
    >
      {children}
    </span>
  );
}
