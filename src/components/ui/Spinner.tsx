import { cn } from "@/lib/utils";

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Učitavanje"
      style={{ width: size, height: size }}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]",
        className,
      )}
    />
  );
}

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-bg text-text-dim">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={26} className="text-accent" />
        {label ? <p className="font-mono text-sm">{label}</p> : null}
      </div>
    </div>
  );
}
