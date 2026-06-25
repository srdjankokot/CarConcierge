// Valé brand lockup (port iz design-files/BrandMark.jsx).
export function BrandMark({
  size = "md",
  showWordmark = true,
  label = "Valé",
  markSrc = "/vale-mark.png",
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  label?: string;
  markSrc?: string;
}) {
  const dims = size === "sm" ? 28 : size === "lg" ? 44 : 32;
  const wordFont = size === "sm" ? 16 : size === "lg" ? 23 : 19;
  return (
    <span
      className="inline-flex items-center font-display font-bold text-text"
      style={{ gap: 11, fontSize: wordFont, letterSpacing: "-0.3px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={markSrc}
        alt={`${label} logo`}
        style={{ width: dims, height: dims, objectFit: "contain", display: "block" }}
      />
      {showWordmark ? label : null}
    </span>
  );
}
