"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Shot {
  url: string;
  phase: string;
}

const navBtn: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(0,0,0,0.45)",
  color: "#fff",
  fontSize: 28,
  lineHeight: 1,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  backdropFilter: "blur(4px)",
};
const closeBtn: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 16,
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(0,0,0,0.45)",
  color: "#fff",
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

function ThumbRow({ title, urls, base, onOpen }: { title: string; urls: string[]; base: number; onOpen: (i: number) => void }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: ".5px", color: "var(--text-faint)", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {urls.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => onOpen(base + i)}
            style={{ padding: 0, border: "1px solid var(--glass-line)", borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "none", lineHeight: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={title} style={{ width: 84, height: 84, objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Galerija foto PRE/POSLE sa popup pregledačem: navigacija strelicama/dugmićima,
// brojač, Esc/klik za zatvaranje. Koriste klijent i dispečer.
export function PhotoGallery({ before, after }: { before?: string[]; after?: string[] }) {
  const beforeUrls = before ?? [];
  const afterUrls = after ?? [];
  const shots: Shot[] = [
    ...beforeUrls.map((url) => ({ url, phase: "PRE" })),
    ...afterUrls.map((url) => ({ url, phase: "POSLE" })),
  ];

  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      else if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + shots.length) % shots.length));
      else if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % shots.length));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, shots.length]);

  if (shots.length === 0) return null;

  const go = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + shots.length) % shots.length));

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {beforeUrls.length ? <ThumbRow title="PRE" urls={beforeUrls} base={0} onOpen={setIndex} /> : null}
        {afterUrls.length ? <ThumbRow title="POSLE" urls={afterUrls} base={beforeUrls.length} onOpen={setIndex} /> : null}
      </div>

      {index !== null && typeof document !== "undefined"
        ? createPortal(
          <div
            onClick={() => setIndex(null)}
            style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.92)", display: "grid", placeItems: "center", padding: "60px 18px" }}
          >
          <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: ".5px" }}>
            {shots[index].phase} · {index + 1} / {shots.length}
          </div>

          <button onClick={(e) => { e.stopPropagation(); setIndex(null); }} aria-label="Zatvori" style={closeBtn}>
            ×
          </button>

          {shots.length > 1 ? (
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Prethodna" style={{ ...navBtn, left: 14 }}>
              ‹
            </button>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shots[index].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "min(92vw, 1100px)", maxHeight: "82vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 24px 60px -20px rgba(0,0,0,0.85)" }}
          />

          {shots.length > 1 ? (
            <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Sledeća" style={{ ...navBtn, right: 14 }}>
              ›
            </button>
          ) : null}
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
