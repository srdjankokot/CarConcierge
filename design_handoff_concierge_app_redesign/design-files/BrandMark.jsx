import React from "react";

/**
 * Valé brand lockup — gold "V" mark + wordmark. Use in nav bars, auth screens,
 * headers. The default mark is a self-contained gradient "V" square (works at
 * any path depth). Pass `markSrc` to use the real car+valet logo image
 * (assets/vale-mark.png / vale-icon.png) with a path relative to the host page.
 * Inherits text color for the wordmark.
 */
export function BrandMark({ size = "md", showWordmark = true, label = "Valé", markSrc, className, style }) {
  const dims = size === "sm" ? 28 : size === "lg" ? 44 : 32;
  const font = size === "sm" ? 16 : size === "lg" ? 24 : 19;
  const wordFont = size === "sm" ? 16 : size === "lg" ? 23 : 19;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 11,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: wordFont,
        letterSpacing: "-0.3px",
        color: "var(--text)",
        ...style,
      }}
    >
      {markSrc ? (
        <img src={markSrc} alt={`${label} logo`} style={{ width: dims, height: dims, objectFit: "contain", display: "block" }} />
      ) : (
        <span
          style={{
            width: dims,
            height: dims,
            borderRadius: 9,
            background: "var(--brass-grad, linear-gradient(135deg, #e0c184, #c9a86a 55%, #a67f3d))",
            display: "grid",
            placeItems: "center",
            color: "#1a130a",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: font,
            boxShadow: "0 2px 14px rgba(201,168,106,0.3)",
          }}
        >
          V
        </span>
      )}
      {showWordmark ? label : null}
    </span>
  );
}
