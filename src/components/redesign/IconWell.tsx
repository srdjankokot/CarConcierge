import { Icon, type IconName } from "@/components/ui/Icon";

export function IconWell({ name, accent = false }: { name: IconName; accent?: boolean }) {
  return (
    <span
      style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        color: accent ? "#1a130a" : "var(--brass)",
        background: accent ? "var(--brass-grad)" : "rgba(201,168,106,0.12)",
        border: accent ? "none" : "1px solid var(--glass-line)",
        boxShadow: accent ? "0 8px 20px -8px rgba(201,168,106,0.6)" : "none",
        flexShrink: 0,
      }}
    >
      <Icon name={name} size={22} />
    </span>
  );
}
