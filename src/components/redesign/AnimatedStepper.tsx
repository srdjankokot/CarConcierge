"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { STATUS_FLOW, STATUS_META } from "@/lib/constants";
import type { RequestStatus } from "@/types";

// Vertikalni stepper sa sekvencijalnim otkrivanjem koraka (160ms po koraku).
export function AnimatedStepper({ status }: { status: RequestStatus }) {
  const [shown, setShown] = useState(0);
  const current = STATUS_FLOW.indexOf(status);
  const target = current < 0 ? 0 : current;

  useEffect(() => {
    setShown(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= target) clearInterval(t);
    }, 160);
    return () => clearInterval(t);
  }, [status, target]);

  if (status === "REJECTED" || status === "CANCELLED") {
    return (
      <div
        className="glass-soft"
        style={{
          padding: "16px 18px",
          color: "var(--warn)",
          border: "1px solid color-mix(in srgb, var(--warn) 40%, transparent)",
          background: "color-mix(in srgb, var(--warn) 10%, transparent)",
        }}
      >
        {STATUS_META[status].label}
      </div>
    );
  }

  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
      {STATUS_FLOW.map((s, i) => {
        const state =
          i < shown ? "done" : i === shown && shown <= target ? "active" : i <= target ? "done" : "pending";
        const isDone = state === "done";
        const isActive = i === target;
        const last = i === STATUS_FLOW.length - 1;
        const reached = i <= shown;
        return (
          <li key={s} style={{ display: "flex", gap: 14, minHeight: 44 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  position: "relative",
                  width: 16,
                  height: 16,
                  marginTop: 2,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: isActive ? "var(--brass-grad)" : isDone ? "var(--mint)" : "rgba(255,255,255,0.04)",
                  border: isActive || isDone ? "none" : "2px solid var(--border)",
                  boxShadow: isActive
                    ? "0 0 0 5px rgba(201,168,106,0.18)"
                    : isDone
                      ? "0 0 12px rgba(111,211,163,0.5)"
                      : "none",
                  transform: reached ? "scale(1)" : "scale(0)",
                  transition: "transform .4s cubic-bezier(.2,1.4,.4,1)",
                }}
              >
                {isActive ? <span className="rd-pulse" style={{ position: "absolute", inset: 0, borderRadius: "50%" }} /> : null}
                {isDone && !isActive ? <Icon name="check" size={9} strokeWidth={2.6} style={{ color: "#0a110d" }} /> : null}
              </span>
              {!last ? (
                <span style={{ width: 2, flex: 1, minHeight: 22, background: "var(--border)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                  <span style={{ position: "absolute", top: 0, left: 0, right: 0, background: "var(--mint-grad)", height: i < shown ? "100%" : "0%", transition: "height .35s ease" }} />
                </span>
              ) : null}
            </div>
            <span
              style={{
                paddingBottom: 14,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: reached ? "var(--text)" : "var(--text-faint)",
                opacity: reached ? 1 : 0.5,
                transition: "opacity .3s, color .3s",
              }}
            >
              {STATUS_META[s].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
