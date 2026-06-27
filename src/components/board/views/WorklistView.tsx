"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { FILTERS, isLate, rankRow, statusKind, t2m, type BoardDriver, type BoardRequest } from "@/lib/board/model";
import { DriverChip, Meta, StatusPill, VWell, iconBtn } from "../ui";
import { ActionButton } from "../ActionButton";

export function WorklistView({
  reqs,
  drivers,
  flashId,
  busyId,
  onCompose,
  onAssign,
  onClose,
  onOpenDetail,
}: {
  reqs: BoardRequest[];
  drivers: BoardDriver[];
  flashId: string | null;
  busyId: string | null;
  onCompose: (id: string) => void;
  onAssign: (id: string, uid: string) => void;
  onClose: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const rows = reqs
    .filter((r) => FILTERS.find((f) => f.key === filter)!.test(r))
    .filter((r) => !q || (r.title + r.client + (r.plate ?? "")).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => rankRow(a) - rankRow(b) || t2m(a.from) - t2m(b.from));

  return (
    <div className="rd-fade">
      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const n = reqs.filter(f.test).length;
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  padding: "8px 13px",
                  borderRadius: 999,
                  cursor: "pointer",
                  color: on ? "#10231a" : "var(--text-dim)",
                  background: on ? "var(--mint-grad)" : "rgba(255,255,255,0.04)",
                  border: on ? "none" : "1px solid var(--glass-line)",
                  fontWeight: on ? 600 : 500,
                  transition: "all .15s",
                }}
              >
                {f.label}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, opacity: 0.75 }}>{n}</span>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative", minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }}>
            <Icon name="search" size={15} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Vozilo, klijent, tablica…"
            style={{ width: "100%", background: "rgba(8,14,11,0.55)", border: "1px solid var(--glass-line)", borderRadius: 11, padding: "9px 12px 9px 34px", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13.5, outline: "none" }}
          />
        </div>
      </div>

      {/* rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.length === 0 ? (
          <div className="glass-soft" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-faint)", fontSize: 14 }}>Nema zahteva u ovom filteru.</div>
        ) : (
          rows.map((r, i) => {
            const late = isLate(r);
            const kind = statusKind(r.status);
            const accent = late ? "var(--warn)" : kind === "action" ? "var(--brass)" : kind === "live" ? "var(--mint)" : "transparent";
            return (
              <div
                key={r.id}
                className={"glass-soft rd-card-hover rd-rise" + (flashId === r.id ? " rd-flash" : "")}
                style={{ position: "relative", overflow: "hidden", padding: "15px 18px 15px 20px", display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 18, animationDelay: `${Math.min(i, 8) * 0.04}s` }}
              >
                <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
                {/* vehicle */}
                <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                  <VWell icon={r.icon} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>{r.title}</span>
                      {r.plate ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", border: "1px solid var(--glass-line)", padding: "2px 7px", borderRadius: 6 }}>{r.plate}</span> : null}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.client}</div>
                  </div>
                </div>
                {/* middle */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <StatusPill status={r.status} />
                  <Meta icon="clock" warn={late}>
                    {r.from}–{r.to}
                    {late ? " · kasni" : ""}
                  </Meta>
                  <DriverChip name={r.driver} />
                  <span style={{ display: "flex", gap: 5 }}>
                    {r.services.slice(0, 2).map((s) => (
                      <span key={s} style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--text-faint)" }}>{s}</span>
                    ))}
                  </span>
                </div>
                {/* actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ActionButton r={r} drivers={drivers} busy={busyId === r.id} onCompose={onCompose} onAssign={onAssign} onClose={onClose} />
                  {r.phone ? (
                    <a href={`tel:${r.phone}`} title="Pozovi klijenta" style={{ ...iconBtn, display: "grid", textDecoration: "none" }}>
                      <Icon name="phone" size={16} />
                    </a>
                  ) : null}
                  <button title="Vidi sve detalje" onClick={() => onOpenDetail(r.id)} style={iconBtn}>
                    <Icon name="chevronRight" size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
