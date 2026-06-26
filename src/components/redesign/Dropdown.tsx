"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "— Izaberi —",
  searchable = false,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="rd-in"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, color: selected ? "var(--text)" : "var(--text-faint)" }}>
          {selected?.icon}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-faint)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open ? (
        <div className="glass rd-pop" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, maxHeight: 300, overflowY: "auto", padding: 6 }}>
          {searchable ? (
            <input
              className="rd-in"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pretraga…"
              style={{ marginBottom: 6, position: "sticky", top: 0 }}
            />
          ) : null}
          {filtered.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQ("");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  background: active ? "color-mix(in srgb, var(--brass) 13%, transparent)" : "transparent",
                  color: active ? "var(--brass-soft)" : "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {o.icon}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
              </button>
            );
          })}
          {filtered.length === 0 ? <div style={{ padding: "10px 12px", color: "var(--text-faint)", fontSize: 13 }}>Nema rezultata</div> : null}
        </div>
      ) : null}
    </div>
  );
}
