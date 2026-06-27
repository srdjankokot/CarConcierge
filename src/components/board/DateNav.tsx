import { Icon } from "@/components/ui/Icon";
import { shiftDate, todayStr } from "@/lib/board/model";

const DANI = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
const MESECI = ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"];

function labelFor(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return `${DANI[d.getDay()]} · ${d.getDate()}. ${MESECI[d.getMonth()]}`;
}

const navBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  display: "grid",
  placeItems: "center",
  borderRadius: 10,
  cursor: "pointer",
  color: "var(--text-dim)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--glass-line)",
};

export function DateNav({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const today = todayStr();
  const isToday = date === today;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => setDate(shiftDate(date, -1))} style={navBtn} aria-label="Prethodni dan">
        <Icon name="chevronLeft" size={16} />
      </button>
      <button
        onClick={() => setDate(today)}
        title="Na danas"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          padding: "8px 13px",
          borderRadius: 999,
          cursor: "pointer",
          whiteSpace: "nowrap",
          color: isToday ? "var(--mint)" : "var(--text-dim)",
          background: isToday ? "color-mix(in srgb, var(--mint) 12%, transparent)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isToday ? "color-mix(in srgb, var(--mint) 35%, transparent)" : "var(--glass-line)"}`,
        }}
      >
        <Icon name="calendar" size={14} />
        {labelFor(date)}
        {isToday ? " · danas" : ""}
      </button>
      <button onClick={() => setDate(shiftDate(date, 1))} style={navBtn} aria-label="Sledeći dan">
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}
