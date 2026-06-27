"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { AnimatedStepper } from "@/components/redesign/AnimatedStepper";
import { RequestDetailBody } from "./RequestDetailBody";
import { dispatcherNextStep, isLate, type BoardDriver, type BoardRequest } from "@/lib/board/model";
import { StatusPill, VWell, ghostBtn, iconBtn, initials, primaryBtn } from "./ui";

// Umeren „spring" (blagi overshoot). Za jači odskok podigni 1.42 → ~1.6; za potpuno
// smooth (bez odskoka) vrati na cubic-bezier(.2,1,.3,1).
const EASE_SPRING = "cubic-bezier(.34,1.42,.5,1)";
const ANIM_MS = 430;

function DetailRow({ icon, label, children }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--glass-line)" }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--brass)", background: "rgba(201,168,106,0.10)", flexShrink: 0 }}>
        <Icon name={icon} size={15} />
      </span>
      <span style={{ fontSize: 12.5, color: "var(--text-faint)", width: 78, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "var(--text)", marginLeft: "auto", textAlign: "right" }}>{children}</span>
    </div>
  );
}

export function DetailDrawer({
  r,
  drivers,
  busy,
  onClose,
  onAssign,
  onCloseJob,
  onCancel,
}: {
  r: BoardRequest;
  drivers: BoardDriver[];
  busy: boolean;
  onClose: () => void;
  onAssign: (id: string, uid: string) => void;
  onCloseJob: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const requestClose = () => {
    setClosing(true);
    window.setTimeout(onClose, ANIM_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (expanded) setExpanded(false);
      else {
        setClosing(true);
        window.setTimeout(onClose, ANIM_MS);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, onClose]);

  const late = isLate(r);
  const step = dispatcherNextStep(r.status);
  const cancelable = !["DELIVERED", "CLOSED", "REJECTED", "CANCELLED"].includes(r.status);
  const translate = closing || !shown ? "translateX(100%)" : "translateX(0)";

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", justifyContent: "flex-end", overflow: "hidden" }}>
      <div
        onClick={requestClose}
        style={{ position: "absolute", inset: 0, background: "rgba(4,8,6,0.62)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", opacity: closing || !shown ? 0 : 1, transition: "opacity .3s ease" }}
      />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          position: "relative",
          width: expanded ? "min(1000px, 97vw)" : "min(440px, 92vw)",
          height: "100%",
          borderRadius: "26px 0 0 26px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "-30px 0 80px -30px rgba(0,0,0,0.9)",
          transform: translate,
          transition: `transform ${ANIM_MS}ms ${EASE_SPRING}, width ${ANIM_MS}ms ${EASE_SPRING}`,
        }}
      >
        {expanded ? (
          <div key="full" className="rd-fade" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px", borderBottom: "1px solid var(--glass-line)" }}>
              <button onClick={() => setExpanded(false)} title="Nazad na sažetak" aria-label="Nazad na sažetak" style={iconBtn}>
                <Icon name="chevronRight" size={17} />
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", letterSpacing: ".6px" }}>PUN DETALJ</span>
              <div style={{ flex: 1 }} />
              <button onClick={requestClose} title="Zatvori" style={iconBtn}>
                <Icon name="x" size={17} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 28px" }}>
              <RequestDetailBody requestId={r.id} embedded />
            </div>
          </div>
        ) : (
          <div key="quick" className="rd-fade" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* header */}
            <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--glass-line)", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <button onClick={() => setExpanded(true)} title="Pun detalj" aria-label="Pun detalj" style={iconBtn}>
                <Icon name="chevronLeft" size={17} />
              </button>
              <VWell icon={r.icon} size={48} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, letterSpacing: "-.4px" }}>{r.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  {r.plate ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", border: "1px solid var(--glass-line)", padding: "2px 8px", borderRadius: 6 }}>{r.plate}</span> : null}
                  {r.year ? <span style={{ fontSize: 12.5, color: "var(--text-dim)" }}>God. {r.year}</span> : null}
                </div>
              </div>
              <button onClick={requestClose} aria-label="Zatvori" style={iconBtn}>
                <Icon name="x" size={17} />
              </button>
            </div>

            {/* body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 22px" }}>
              <div style={{ marginBottom: 18 }}>
                <StatusPill status={r.status} />
              </div>
              <DetailRow icon="user" label="Klijent">{r.client}</DetailRow>
              <DetailRow icon="phone" label="Telefon">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{r.phone || "—"}</span>
              </DetailRow>
              <DetailRow icon="clock" label="Termin">
                <span style={{ color: late ? "var(--warn)" : "var(--text)" }}>
                  {r.from}–{r.to}
                  {late ? " · kasni" : ""}
                </span>
              </DetailRow>
              <DetailRow icon="user" label="Vozač">{r.driver || <span style={{ color: "var(--text-faint)" }}>nije dodeljen</span>}</DetailRow>

              <div style={{ marginTop: 18, marginBottom: 8, fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: ".6px", color: "var(--text-faint)" }}>USLUGE</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 22 }}>
                {r.services.map((s) => (
                  <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-line)", color: "var(--text-dim)" }}>
                    <span style={{ color: "var(--brass)" }}>
                      <Icon name={r.icon} size={15} />
                    </span>
                    {s}
                  </span>
                ))}
              </div>

              <div style={{ marginBottom: 10, fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: ".6px", color: "var(--text-faint)" }}>TOK STATUSA</div>
              <AnimatedStepper status={r.status} />
            </div>

            {/* footer */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid var(--glass-line)", background: "rgba(10,17,13,0.6)", display: "flex", flexDirection: "column", gap: 10 }}>
              {r.status === "CONFIRMED" ? (
                <div style={{ position: "relative" }}>
                  <button disabled={busy} onClick={() => setAssignOpen((o) => !o)} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
                    <Icon name="user" size={15} />
                    Dodeli vozača
                  </button>
                  {assignOpen ? (
                    <div className="glass rd-pop" style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0, padding: 8, borderRadius: 14, zIndex: 5 }}>
                      {drivers.length === 0 ? (
                        <div style={{ padding: "8px 10px", fontSize: 12.5, color: "var(--text-faint)" }}>Nema aktivnih vozača.</div>
                      ) : (
                        drivers.map((d) => (
                          <button key={d.uid} onClick={() => { setAssignOpen(false); onAssign(r.id, d.uid); }} style={{ ...ghostBtn, width: "100%", justifyContent: "flex-start", marginBottom: 2, fontSize: 12.5 }}>
                            <span style={{ width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "#10231a", background: "var(--mint-grad)" }}>{initials(d.name)}</span>
                            {d.name}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              ) : step?.kind === "compose" ? (
                <button disabled={busy} onClick={() => setExpanded(true)} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
                  <Icon name="plus" size={15} />
                  Pošalji ponudu
                </button>
              ) : step?.kind === "close" ? (
                <button disabled={busy} onClick={() => onCloseJob(r.id)} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
                  <Icon name="check" size={15} />
                  Zatvori posao
                </button>
              ) : null}

              {r.phone ? (
                <a href={`tel:${r.phone}`} style={{ ...ghostBtn, width: "100%", justifyContent: "center", textDecoration: "none" }}>
                  <Icon name="phone" size={15} />
                  Pozovi klijenta
                </a>
              ) : null}

              {cancelable ? (
                <button onClick={() => onCancel(r.id)} style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 12.5, cursor: "pointer", padding: "2px 0", alignSelf: "center" }}>
                  Otkaži posao
                </button>
              ) : null}
            </div>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
