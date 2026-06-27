import { Icon, type IconName } from "@/components/ui/Icon";

export type BoardView = "timeline" | "list" | "kanban";

const OPTS: { key: BoardView; label: string; icon: IconName }[] = [
  { key: "timeline", label: "Raspored", icon: "timeline" },
  { key: "list", label: "Lista", icon: "list" },
  { key: "kanban", label: "Kanban", icon: "kanban" },
];

export function Switcher({ view, setView }: { view: BoardView; setView: (v: BoardView) => void }) {
  return (
    <div style={{ display: "inline-flex", padding: 4, gap: 4, borderRadius: 13, background: "rgba(8,14,11,0.5)", border: "1px solid var(--glass-line)" }}>
      {OPTS.map((o) => {
        const on = view === o.key;
        return (
          <button
            key={o.key}
            onClick={() => setView(o.key)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: on ? 600 : 500, padding: "8px 16px", borderRadius: 10, cursor: "pointer", border: "none", color: on ? "#10231a" : "var(--text-dim)", background: on ? "var(--mint-grad)" : "transparent", transition: "all .15s" }}
          >
            <Icon name={o.icon} size={15} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
