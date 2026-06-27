"use client";

import { useEffect, useRef } from "react";
import type { BoardDriver } from "@/lib/board/model";
import { initials } from "./ui";

export function DriverPicker({
  drivers,
  onPick,
  onClose,
  anchor = "right",
}: {
  drivers: BoardDriver[];
  onPick: (uid: string) => void;
  onClose: () => void;
  anchor?: "right" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="glass rd-pop"
      style={{ position: "absolute", top: "calc(100% + 8px)", zIndex: 60, width: 220, padding: 8, borderRadius: 16, ...(anchor === "right" ? { right: 0 } : { left: 0 }) }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".5px", color: "var(--text-faint)", padding: "6px 10px 8px" }}>DODELI VOZAČA</div>
      {drivers.length === 0 ? (
        <div style={{ padding: "8px 10px 10px", fontSize: 12.5, color: "var(--text-faint)" }}>Nema aktivnih vozača — dodaj ih na stranici Vozači.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {drivers.map((d) => (
            <button
              key={d.uid}
              onClick={() => onPick(d.uid)}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: "9px 10px", borderRadius: 11, textAlign: "left", fontFamily: "var(--font-body)", fontSize: 13.5 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 10, color: "#10231a", background: "var(--mint-grad)", flexShrink: 0 }}>
                {initials(d.name)}
              </span>
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
