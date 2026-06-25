import React from "react";

/**
 * Auto Concierge line-icon set. Stroke = currentColor, 1.6 weight, rounded
 * caps/joins — lifted from the product's icons.tsx. Color via `color` style
 * or a parent text color; size via the `size` prop.
 */
const PATHS = {
  car: (
    <>
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14M5 11v5m14-5v5M7 16h10M6 16v2m12-2v2" />
      <circle cx="7.5" cy="13.5" r="1" />
      <circle cx="16.5" cy="13.5" r="1" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.3-2.3z" />,
  clipboard: (
    <>
      <path d="M9 4h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V5a1 1 0 0 1 1-1z" />
      <path d="M9 5h6v2H9z" />
      <path d="M8 12h8M8 16h5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" />
      <path d="M20 13a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2 1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" />
      <path d="M18 19a4 4 0 0 1-4 3h-2" />
    </>
  ),
  steering: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M3.2 11h7.3M13.5 12.3l3 7M10.5 12.3l-3 7" />
    </>
  ),
  tire: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v3m0 10v3m8-8h-3M7 12H4" />
    </>
  ),
  wash: (
    <>
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14M5 13v4m14-4v4M7 17h10" />
      <path d="M12 3v2m3-1l-1 1.5M9 4l1 1.5" />
    </>
  ),
  truck: <path d="M3 12h11l3-4h2.5a1.5 1.5 0 0 1 1.5 1.5V14h-2M3 12v4h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M3 12V8a1 1 0 0 1 1-1h6" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  arrowLeft: <path d="M15 6l-6 6 6 6" />,
  check: <path d="M5 12l4.5 4.5L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

export function Icon({ name = "car", size = 22, strokeWidth = 1.6, className, style, ...rest }) {
  const glyph = PATHS[name] ?? PATHS.car;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      {glyph}
    </svg>
  );
}
