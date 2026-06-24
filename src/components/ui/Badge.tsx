import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("badge", className)} {...rest}>
      {children}
    </span>
  );
}
