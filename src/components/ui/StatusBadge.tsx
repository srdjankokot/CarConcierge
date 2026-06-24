import { cn } from "@/lib/utils";
import { STATUS_META, type StatusTone } from "@/lib/constants";
import type { RequestStatus } from "@/types";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "text-text-dim",
  active: "text-accent",
  done: "text-mint",
  warn: "text-[#e0954a]",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("badge gap-1.5", TONE_CLASS[meta.tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
