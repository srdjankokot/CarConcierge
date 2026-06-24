import { SERVICE_TYPE_LABEL } from "@/lib/constants";
import type { ServiceItem } from "@/types";

export function ServiceChips({ services }: { services: ServiceItem[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {services.map((s) => (
        <span key={s.id} className="badge">
          {SERVICE_TYPE_LABEL[s.type]}
          {s.type === "other" && s.label ? `: ${s.label}` : ""}
        </span>
      ))}
    </div>
  );
}
