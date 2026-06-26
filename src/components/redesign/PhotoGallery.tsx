"use client";

import { useState } from "react";

function Thumbs({ title, urls, onOpen }: { title: string; urls?: string[]; onOpen: (u: string) => void }) {
  if (!urls?.length) return null;
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: ".5px", color: "var(--text-faint)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {urls.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => onOpen(u)}
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

// Galerija foto PRE/POSLE sa lightbox-om na klik. Koriste klijent i dispečer.
export function PhotoGallery({ before, after }: { before?: string[]; after?: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!before?.length && !after?.length) return null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Thumbs title="PRE" urls={before} onOpen={setOpen} />
        <Thumbs title="POSLE" urls={after} onOpen={setOpen} />
      </div>
      {open ? (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 24, cursor: "zoom-out" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)" }} />
        </div>
      ) : null}
    </>
  );
}
