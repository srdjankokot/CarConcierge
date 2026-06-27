"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import {
  DAY_END,
  DAY_SPAN,
  DAY_START,
  dispatcherNextStep,
  isLate,
  laneOverlaps,
  m2t,
  nowMinutes,
  pct,
  statusColor,
  statusKind,
  t2m,
  todayStr,
  type BoardDriver,
  type BoardRequest,
} from "@/lib/board/model";
import { DriverChip, Meta, StatusPill, VWell, ghostBtn, initials, primaryBtn } from "../ui";

interface Handlers {
  drivers: BoardDriver[];
  busyId: string | null;
  onCompose: (id: string) => void;
  onAssign: (id: string, uid: string) => void;
  onClose: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

const POP_W = 240,
  POP_H = 250;

function TimelineBlock({ r, conflict, h }: { r: BoardRequest; conflict: boolean; h: Handlers }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; flip: boolean } | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const c = statusColor(r.status);
  const kind = statusKind(r.status);
  const left = pct(t2m(r.from));
  const width = `calc(${((t2m(r.to) - t2m(r.from)) / DAY_SPAN) * 100}% - 4px)`;
  const late = isLate(r);
  const border = conflict || late ? "var(--warn)" : `color-mix(in srgb, ${c} 45%, transparent)`;
  const canAssign = r.status === "CONFIRMED";
  const step = dispatcherNextStep(r.status);

  const place = () => {
    const el = blockRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const vw = window.innerWidth,
      vh = window.innerHeight,
      m = 10;
    const l = Math.max(m, Math.min(b.left, vw - POP_W - m));
    const roomBelow = vh - b.bottom,
      roomAbove = b.top;
    const flip = roomBelow < POP_H + 12 && roomAbove > roomBelow;
    let top = flip ? b.top - 8 : b.bottom + 8;
    if (!flip) top = Math.min(top, vh - POP_H - m);
    setPos({ left: l, top, flip });
  };
  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const popover =
    open && pos
      ? createPortal(
          <>
            <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
            <div
              className="glass rd-pop"
              onClick={(e) => e.stopPropagation()}
              style={{ position: "fixed", left: pos.left, top: pos.top, transform: pos.flip ? "translateY(-100%)" : "none", zIndex: 9999, width: POP_W, padding: 14, borderRadius: 16, boxShadow: "0 24px 60px -22px rgba(0,0,0,0.85)" }}
            >
              <button onClick={() => setOpen(false)} aria-label="Zatvori" style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 8, cursor: "pointer", color: "var(--text-dim)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-line)" }}>
                <Icon name="x" size={14} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingRight: 26 }}>
                <VWell icon={r.icon} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{r.client}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                <StatusPill status={r.status} />
                <Meta icon="clock" warn={late}>
                  {r.from}–{r.to}
                  {late ? " · kasni" : ""}
                </Meta>
                <DriverChip name={r.driver} />
              </div>
              {canAssign ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: ".5px" }}>DODELI VOZAČA</div>
                  {h.drivers.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Nema aktivnih vozača.</div>
                  ) : (
                    h.drivers.map((d) => (
                      <button key={d.uid} onClick={() => { setOpen(false); h.onAssign(r.id, d.uid); }} style={{ ...ghostBtn, justifyContent: "flex-start", fontSize: 12.5, padding: "7px 11px" }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "#10231a", background: "var(--mint-grad)" }}>{initials(d.name)}</span>
                        {d.name}
                      </button>
                    ))
                  )}
                </div>
              ) : step ? (
                <button
                  onClick={() => { setOpen(false); step.kind === "compose" ? h.onCompose(r.id) : h.onClose(r.id); }}
                  style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}
                >
                  <Icon name={step.icon} size={14} />
                  {step.label}
                </button>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>Vozač upravlja statusom</div>
              )}
              <button onClick={() => { setOpen(false); h.onOpenDetail(r.id); }} style={{ ...ghostBtn, width: "100%", justifyContent: "center", marginTop: 8, fontSize: 12.5 }}>
                <Icon name="list" size={14} />
                Vidi sve detalje
              </button>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div
      ref={blockRef}
      onClick={toggle}
      title={`${r.title} · ${r.from}–${r.to}`}
      style={{
        position: "absolute",
        left,
        width,
        top: 8,
        bottom: 8,
        minWidth: 64,
        cursor: "pointer",
        borderRadius: 11,
        padding: "8px 10px",
        background: `color-mix(in srgb, ${c} 15%, rgba(13,21,16,0.85))`,
        border: `1px solid ${open ? c : border}`,
        boxShadow: open
          ? `0 0 0 2px color-mix(in srgb, ${c} 40%, transparent)`
          : kind === "live"
            ? `0 0 0 1px color-mix(in srgb, ${c} 25%, transparent), 0 8px 20px -12px ${c}`
            : "0 8px 20px -14px rgba(0,0,0,0.8)",
        transition: "transform .15s, box-shadow .15s, border-color .15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span className={kind === "live" ? "rd-pulse" : ""} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}`, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {r.from}–{r.to} · {r.services[0]}
      </div>
      {conflict ? (
        <span style={{ position: "absolute", top: -7, right: -7, color: "var(--warn)" }}>
          <Icon name="alert" size={15} />
        </span>
      ) : null}
      {popover}
    </div>
  );
}

export function TimelineView({ reqs, date, ...h }: { reqs: BoardRequest[]; date: string } & Handlers) {
  const hours: number[] = [];
  for (let hr = DAY_START / 60; hr <= DAY_END / 60; hr++) hours.push(hr);
  const lanes = [{ key: "_un", label: "Nedodeljeno", driverName: null as string | null }, ...h.drivers.map((d) => ({ key: d.uid, label: d.name, driverName: d.name }))];
  const colW = 78;
  const trackW = (hours.length - 1) * colW;
  const isToday = date === todayStr();
  const nowMin = nowMinutes();
  const showNow = isToday && nowMin >= DAY_START && nowMin <= DAY_END;

  return (
    <div className="rd-fade glass-soft" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: trackW + 150 }}>
          {/* hour ruler */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--glass-line)" }}>
            <div style={{ width: 150, flexShrink: 0, padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", letterSpacing: ".5px" }}>VOZAČ</div>
            <div style={{ position: "relative", flex: 1, minWidth: trackW, minHeight: 46 }}>
              {hours.map((hr) => (
                <span key={hr} style={{ position: "absolute", left: pct(hr * 60), transform: "translateX(-50%)", top: 11, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)" }}>{m2t(hr * 60)}</span>
              ))}
              {showNow ? (
                <span style={{ position: "absolute", left: pct(nowMin), transform: "translateX(-50%)", top: 27, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, color: "#10231a", background: "var(--mint-grad)", padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>SAD {m2t(nowMin)}</span>
              ) : null}
            </div>
          </div>
          {/* lanes */}
          {lanes.map((lane, li) => {
            const items = reqs.filter((r) => (lane.driverName ? r.driver === lane.driverName : !r.driver)).sort((a, b) => t2m(a.from) - t2m(b.from));
            const conflicts = laneOverlaps(items);
            return (
              <div
                key={lane.key}
                className="rd-rise"
                style={{ display: "flex", borderBottom: li < lanes.length - 1 ? "1px solid var(--glass-line)" : "none", background: lane.driverName ? "transparent" : "rgba(201,168,106,0.04)", animationDelay: `${li * 0.05}s` }}
              >
                <div style={{ width: 150, flexShrink: 0, padding: "0 16px", display: "flex", alignItems: "center", gap: 9, minHeight: 76 }}>
                  {lane.driverName ? (
                    <>
                      <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#10231a", background: "var(--mint-grad)", flexShrink: 0 }}>{initials(lane.label)}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{lane.label}</span>
                    </>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--brass-soft)", fontWeight: 500 }}>
                      <Icon name="bolt" size={15} />
                      {lane.label}
                    </span>
                  )}
                </div>
                <div style={{ position: "relative", flex: 1, minWidth: trackW, minHeight: 76 }}>
                  {hours.map((hr) => (
                    <span key={hr} style={{ position: "absolute", left: pct(hr * 60), top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.04)" }} />
                  ))}
                  {showNow ? <span style={{ position: "absolute", left: pct(nowMin), top: 0, bottom: 0, width: 2, background: "var(--mint)", boxShadow: "0 0 10px var(--mint)", opacity: 0.8 }} /> : null}
                  {items.map((r) => (
                    <TimelineBlock key={r.id} r={r} conflict={conflicts.has(r.id)} h={h} />
                  ))}
                  {items.length === 0 ? <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, color: "var(--text-faint)" }}>—</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
