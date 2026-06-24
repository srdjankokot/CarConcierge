import { cn } from "@/lib/utils";
import { STATUS_FLOW, STATUS_META } from "@/lib/constants";
import type { RequestStatus } from "@/types";

export function StatusStepper({ status }: { status: RequestStatus }) {
  if (status === "REJECTED" || status === "CANCELLED") {
    return (
      <div className="rounded-lg border border-[#e0954a]/40 bg-[#e0954a]/10 px-4 py-3 text-sm text-[#e0954a]">
        {STATUS_META[status].label}
      </div>
    );
  }

  const current = STATUS_FLOW.indexOf(status);

  return (
    <ol className="flex flex-col">
      {STATUS_FLOW.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "pending";
        const isLast = i === STATUS_FLOW.length - 1;
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 h-3 w-3 shrink-0 rounded-full border-2",
                  state === "done" && "border-mint bg-mint",
                  state === "active" && "border-accent bg-accent",
                  state === "pending" && "border-border bg-bg",
                )}
              />
              {!isLast ? (
                <span className={cn("min-h-[18px] w-0.5 flex-1", i < current ? "bg-mint" : "bg-border")} />
              ) : null}
            </div>
            <span
              className={cn(
                "pb-3 text-sm",
                state === "pending" ? "text-text-faint" : "text-text",
                state === "active" && "font-medium",
              )}
            >
              {STATUS_META[s].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
