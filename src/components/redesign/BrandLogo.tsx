"use client";

import { useState } from "react";
import { MAKE_SLUG } from "@/lib/vehicles";

// Logo marke na svetloj pločici (da svaki logo dobro čita na tamnoj podlozi).
// Fallback na monogram (prvo slovo) kad logo ne postoji / "Drugo".
export function BrandLogo({ make, size = 26 }: { make: string; size?: number }) {
  const slug = MAKE_SLUG[make];
  const [err, setErr] = useState(false);

  if (!slug || err) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 7,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          background: "color-mix(in srgb, var(--brass) 18%, transparent)",
          color: "var(--brass)",
          fontWeight: 700,
          fontSize: size * 0.46,
        }}
      >
        {make.trim()[0]?.toUpperCase() ?? "?"}
      </span>
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.92)",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/car-logos/${slug}.png`} alt="" onError={() => setErr(true)} style={{ width: "76%", height: "76%", objectFit: "contain" }} />
    </span>
  );
}
