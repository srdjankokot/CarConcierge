import { Fragment } from "react";
import type { RequestStatus } from "@/types";

const ORDER: RequestStatus[] = ["PICKED_UP", "AT_SERVICE", "RETURNING", "DELIVERED"];
const LABELS: Record<string, string> = {
  PICKED_UP: "Preuzeto",
  AT_SERVICE: "Na usluzi",
  RETURNING: "Vraćanje",
  DELIVERED: "Vraćeno",
};

// Kompaktni horizontalni live-tracker (hero kartica).
export function LiveTracker({ status }: { status: RequestStatus }) {
  const cur = Math.max(0, ORDER.indexOf(status));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 18 }}>
      {ORDER.map((k, i) => {
        const done = i < cur;
        const active = i === cur;
        return (
          <Fragment key={k}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span
                className={active ? "rd-pulse" : ""}
                style={{
                  position: "relative",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: active ? "var(--brass-grad)" : done ? "var(--mint)" : "rgba(255,255,255,0.08)",
                  boxShadow: done ? "0 0 10px rgba(111,211,163,0.5)" : "none",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: active ? "var(--brass-soft)" : done ? "var(--mint)" : "var(--text-faint)",
                  whiteSpace: "nowrap",
                }}
              >
                {LABELS[k]}
              </span>
            </div>
            {i < ORDER.length - 1 ? (
              <span
                style={{
                  flex: 1,
                  height: 2,
                  margin: "0 6px",
                  marginBottom: 18,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: i < cur ? "100%" : "0%",
                    background: "var(--mint-grad)",
                    transition: "width .6s ease",
                    transitionDelay: `${i * 0.15}s`,
                  }}
                />
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
