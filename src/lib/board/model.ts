// Dispečerska tabla — domenski model (port iz prototipa, adaptiran na naš workflow).
import type { CarRequest, RequestStatus, UserProfile } from "@/types";
import type { IconName } from "@/components/ui/Icon";
import { SERVICE_TYPE_LABEL, STATUS_META, requestIcon } from "@/lib/constants";

export interface BoardDriver {
  uid: string;
  name: string;
  phone?: string;
}
export const toBoardDriver = (u: UserProfile): BoardDriver => ({ uid: u.uid, name: u.fullName, phone: u.phone });

// ── Flat „board" oblik zahteva (CarRequest → ravne kolone koje tabla koristi) ──
export interface BoardRequest {
  id: string;
  title: string; // marka + model
  year?: number;
  plate?: string;
  client: string;
  phone: string;
  from: string; // "HH:MM"
  to: string;
  date: string; // "YYYY-MM-DD"
  status: RequestStatus;
  driver: string | null;
  driverPhone?: string;
  services: string[];
  icon: IconName;
  raw: CarRequest;
}

export function toBoardRequest(r: CarRequest): BoardRequest {
  const tw = r.pickup.timeWindow;
  return {
    id: r.id!,
    title: `${r.vehicle.make} ${r.vehicle.model}`.trim(),
    year: r.vehicle.year,
    plate: r.vehicle.plate,
    client: r.clientName || "—",
    phone: r.clientPhone || "",
    from: tw.from,
    to: tw.to,
    date: tw.date,
    status: r.status,
    driver: r.assignedDriver?.name ?? null,
    driverPhone: r.assignedDriver?.phone,
    services: r.services.map((s) => (s.type === "other" && s.label ? s.label : SERVICE_TYPE_LABEL[s.type])),
    icon: requestIcon(r.services),
    raw: r,
  };
}

// ── Status → kind / boja (kind vodi sortiranje, KPI i bojenje) ──
export type StatusKind = "action" | "wait" | "live" | "done" | "bad";

export const STATUS_KIND: Record<RequestStatus, StatusKind> = {
  CREATED: "action",
  OFFER_SENT: "wait",
  CONFIRMED: "action",
  DRIVER_ASSIGNED: "live",
  PICKED_UP: "live",
  AT_SERVICE: "live",
  SERVICE_DONE: "live",
  RETURNING: "live",
  DELIVERED: "done",
  CLOSED: "done",
  REJECTED: "bad",
  CANCELLED: "bad",
};

const KIND_COLOR: Record<StatusKind, string> = {
  action: "var(--brass)",
  wait: "var(--brass-soft)",
  live: "var(--mint)",
  done: "#8aa99a", // sage
  bad: "var(--warn)",
};

export const statusLabel = (s: RequestStatus): string => STATUS_META[s].label;
export const statusKind = (s: RequestStatus): StatusKind => STATUS_KIND[s];
export function statusColor(s: RequestStatus): string {
  if (s === "CLOSED") return "var(--text-faint)";
  return KIND_COLOR[STATUS_KIND[s]];
}

// ── Vremenska osa (07–19h) ──
export const DAY_START = 7 * 60;
export const DAY_END = 19 * 60;
export const DAY_SPAN = DAY_END - DAY_START;

const pad = (n: number) => String(n).padStart(2, "0");
export const t2m = (s: string): number => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const m2t = (m: number): string => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const pct = (min: number): string => `${((min - DAY_START) / DAY_SPAN) * 100}%`;

export const nowMinutes = (): number => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export function shiftDate(date: string, deltaDays: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Posao kasni: pre-preuzimanje faza, a vreme početka prozora je već prošlo (realno sad).
export function isLate(r: BoardRequest): boolean {
  if (!["CREATED", "OFFER_SENT", "CONFIRMED", "DRIVER_ASSIGNED"].includes(r.status)) return false;
  return new Date(`${r.date}T${r.from}:00`).getTime() < Date.now();
}

// ── Sledeća dispečerska akcija (samo gde dispečer stvarno ima moć) ──
export type NextStepKind = "compose" | "assign" | "close";
export interface NextStep {
  label: string;
  kind: NextStepKind;
  primary: boolean;
  icon: IconName;
}
export function dispatcherNextStep(status: RequestStatus): NextStep | null {
  switch (status) {
    case "CREATED":
      return { label: "Pošalji ponudu", kind: "compose", primary: true, icon: "plus" };
    case "CONFIRMED":
      return { label: "Dodeli vozača", kind: "assign", primary: true, icon: "user" };
    case "DELIVERED":
      return { label: "Zatvori", kind: "close", primary: false, icon: "check" };
    default:
      return null;
  }
}

// ── Lista: hitnost + filteri ──
export function rankRow(r: BoardRequest): number {
  if (isLate(r)) return 0;
  const k = STATUS_KIND[r.status];
  return k === "action" ? 1 : k === "wait" ? 2 : k === "live" ? 3 : 4;
}

export const FILTERS: { key: string; label: string; test: (r: BoardRequest) => boolean }[] = [
  { key: "all", label: "Sve", test: () => true },
  { key: "action", label: "Treba akcija", test: (r) => STATUS_KIND[r.status] === "action" },
  { key: "wait", label: "Čeka", test: (r) => STATUS_KIND[r.status] === "wait" },
  { key: "live", label: "U toku", test: (r) => STATUS_KIND[r.status] === "live" },
  { key: "done", label: "Završeno", test: (r) => ["done", "bad"].includes(STATUS_KIND[r.status]) },
];

// ── Kanban kolone ──
export const KCOLS: { key: string; label: string; accent: string; statuses: RequestStatus[] }[] = [
  { key: "new", label: "Novi", accent: "var(--brass)", statuses: ["CREATED"] },
  { key: "offer", label: "Ponuda", accent: "var(--brass-soft)", statuses: ["OFFER_SENT"] },
  { key: "confirmed", label: "Potvrđeno", accent: "var(--brass)", statuses: ["CONFIRMED"] },
  { key: "live", label: "U toku", accent: "var(--mint)", statuses: ["DRIVER_ASSIGNED", "PICKED_UP", "AT_SERVICE", "SERVICE_DONE", "RETURNING"] },
  { key: "done", label: "Završeno", accent: "var(--text-faint)", statuses: ["DELIVERED", "CLOSED", "REJECTED", "CANCELLED"] },
];

// ── Raspored: detekcija preklapanja u istoj traci ──
export function laneOverlaps(items: BoardRequest[]): Set<string> {
  const bad = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (t2m(items[i].from) < t2m(items[j].to) && t2m(items[j].from) < t2m(items[i].to)) {
        bad.add(items[i].id);
        bad.add(items[j].id);
      }
    }
  }
  return bad;
}
