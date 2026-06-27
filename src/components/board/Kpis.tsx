import { Icon, type IconName } from "@/components/ui/Icon";
import { isLate, statusKind, type BoardRequest } from "@/lib/board/model";

export function Kpis({ reqs }: { reqs: BoardRequest[] }) {
  const action = reqs.filter((r) => statusKind(r.status) === "action").length;
  const waiting = reqs.filter((r) => statusKind(r.status) === "wait").length;
  const live = reqs.filter((r) => statusKind(r.status) === "live").length;
  const late = reqs.filter(isLate).length;
  const items: { label: string; v: number; c: string; icon: IconName }[] = [
    { label: "Treba akcija", v: action, c: "var(--brass)", icon: "bolt" },
    { label: "Čeka klijenta", v: waiting, c: "var(--brass-soft)", icon: "clock" },
    { label: "U toku", v: live, c: "var(--mint)", icon: "timeline" },
    { label: "Kasni", v: late, c: late ? "var(--warn)" : "var(--text-faint)", icon: "alert" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
      {items.map((k, i) => (
        <div key={k.label} className="glass-soft rd-rise" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, animationDelay: `${i * 0.05}s` }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", color: k.c, background: `color-mix(in srgb, ${k.c} 13%, transparent)`, flexShrink: 0 }}>
            <Icon name={k.icon} size={18} />
          </span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, lineHeight: 1, color: k.v ? "var(--text)" : "var(--text-faint)" }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 3 }}>{k.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
