import { type ReactNode } from "react";
import { Card } from "./Card";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center">
      {icon ? (
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border-soft bg-bg-2 text-2xl">
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-text-dim">{description}</p> : null}
      {action}
    </Card>
  );
}
