import type { ReactNode, SVGProps } from "react";

// Name-based line-icon set (port iz design-files/Icon.jsx). Stroke = currentColor.
export type IconName =
  | "car"
  | "wrench"
  | "clipboard"
  | "search"
  | "user"
  | "headset"
  | "steering"
  | "tire"
  | "wash"
  | "truck"
  | "bell"
  | "arrowLeft"
  | "check"
  | "plus"
  | "clock"
  | "phone"
  | "bolt"
  | "calendar"
  | "list"
  | "kanban"
  | "timeline"
  | "chevronRight"
  | "chevronLeft"
  | "alert"
  | "x";

const PATHS: Record<IconName, ReactNode> = {
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
  truck: (
    <path d="M3 12h11l3-4h2.5a1.5 1.5 0 0 1 1.5 1.5V14h-2M3 12v4h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M3 12V8a1 1 0 0 1 1-1h6" />
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  arrowLeft: <path d="M15 6l-6 6 6 6" />,
  check: <path d="M5 12l4.5 4.5L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  phone: <path d="M6 4h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3l1.2-2 4 1.5v3a2 2 0 0 1-2.1 2A15.5 15.5 0 0 1 4 6.1 2 2 0 0 1 6 4z" />,
  bolt: <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8z" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2.5" />
      <path d="M4 9.5h16M8 3.5v3M16 3.5v3" />
    </>
  ),
  list: <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />,
  kanban: (
    <>
      <rect x="4" y="5" width="4.5" height="14" rx="1" />
      <rect x="9.75" y="5" width="4.5" height="9" rx="1" />
      <rect x="15.5" y="5" width="4.5" height="11" rx="1" />
    </>
  ),
  timeline: (
    <>
      <path d="M4 7h16M4 13h16M4 19h10" />
      <circle cx="9" cy="7" r="1.6" />
      <circle cx="15" cy="13" r="1.6" />
    </>
  ),
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  alert: (
    <>
      <path d="M12 3 2.5 20h19L12 3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, strokeWidth = 1.6, ...rest }: IconProps) {
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
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name] ?? PATHS.car}
    </svg>
  );
}
