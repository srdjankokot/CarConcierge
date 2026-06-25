import { STATUS_META, statusAccentVar } from "@/lib/constants";
import type { RequestStatus } from "@/types";

export function StatusPill({ status, big = false }: { status: RequestStatus; big?: boolean }) {
  const color = statusAccentVar(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--font-mono)",
        fontSize: big ? 12 : 11,
        padding: big ? "6px 12px" : "5px 10px",
        borderRadius: 999,
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 8px currentColor" }}
      />
      {STATUS_META[status].label}
    </span>
  );
}
