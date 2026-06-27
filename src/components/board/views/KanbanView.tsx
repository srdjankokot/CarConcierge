"use client";

import { Icon } from "@/components/ui/Icon";
import { KCOLS, dispatcherNextStep, isLate, t2m, type BoardDriver, type BoardRequest } from "@/lib/board/model";
import { DriverChip, Meta, VWell } from "../ui";

interface Handlers {
  drivers: BoardDriver[];
  flashId: string | null;
  onCompose: (id: string) => void;
  onClose: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

function KanbanCard({ r, flash, h }: { r: BoardRequest; flash: boolean; h: Handlers }) {
  const late = isLate(r);
  const step = dispatcherNextStep(r.status);
  return (
    <div
      className={"glass-soft rd-card-hover" + (flash ? " rd-flash" : "")}
      onClick={() => h.onOpenDetail(r.id)}
      style={{ position: "relative", overflow: "hidden", padding: "13px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 9 }}
    >
      {late ? <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--warn)" }} /> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <VWell icon={r.icon} size={36} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.client}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Meta icon="clock" warn={late}>
          {r.from}–{r.to}
        </Meta>
        {r.plate ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-faint)", border: "1px solid var(--glass-line)", padding: "1px 6px", borderRadius: 5 }}>{r.plate}</span> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <DriverChip name={r.driver} />
        {step ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (step.kind === "compose") h.onCompose(r.id);
              else if (step.kind === "close") h.onClose(r.id);
              else h.onOpenDetail(r.id); // assign → preko detalja
            }}
            title={step.label}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 11.5, padding: "6px 10px", borderRadius: 9, border: "none", cursor: "pointer", background: step.primary ? "var(--brass-grad)" : "rgba(255,255,255,0.06)", color: step.primary ? "#1a130a" : "var(--text)", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <Icon name={step.icon} size={13} />
            {step.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanView({ reqs, ...h }: { reqs: BoardRequest[] } & Handlers) {
  return (
    <div className="rd-fade" style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ display: "flex", gap: 14, minWidth: "min-content" }}>
        {KCOLS.map((col, ci) => {
          const items = reqs.filter((r) => col.statuses.includes(r.status)).sort((a, b) => t2m(a.from) - t2m(b.from));
          return (
            <div key={col.key} className="rd-rise" style={{ width: 264, flexShrink: 0, display: "flex", flexDirection: "column", animationDelay: `${ci * 0.05}s` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 4px 12px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.accent, boxShadow: `0 0 8px ${col.accent}` }} />
                <span style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 600 }}>{col.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 999 }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "rgba(255,255,255,0.018)", border: "1px solid var(--glass-line)", borderRadius: 16, padding: 10, minHeight: 120, flex: 1 }}>
                {items.length === 0 ? (
                  <div style={{ padding: "26px 8px", textAlign: "center", fontSize: 12, color: "var(--text-faint)" }}>—</div>
                ) : (
                  items.map((r) => <KanbanCard key={r.id} r={r} flash={h.flashId === r.id} h={h} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
