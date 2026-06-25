import { SERVICE_TYPE_LABEL, requestIcon } from "@/lib/constants";
import { IconWell } from "./IconWell";
import { StatusPill } from "./StatusPill";
import { Chip } from "./Chip";
import type { CarRequest } from "@/types";

export function RequestTile({
  request,
  index = 0,
  onClick,
}: {
  request: CarRequest;
  index?: number;
  onClick?: () => void;
}) {
  const tw = request.pickup.timeWindow;
  return (
    <div
      className="glass-soft rd-rise rd-card-hover"
      style={{ padding: 18, cursor: onClick ? "pointer" : undefined, animationDelay: `${0.06 * index + 0.1}s` }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <IconWell name={requestIcon(request.services)} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {request.vehicle.make} {request.vehicle.model} · {request.vehicle.year}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
              {tw.date} · {tw.from}–{tw.to}
            </div>
          </div>
        </div>
        <StatusPill status={request.status} />
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap" }}>
        {request.services.map((s) => (
          <Chip key={s.id}>{SERVICE_TYPE_LABEL[s.type]}</Chip>
        ))}
      </div>
    </div>
  );
}
