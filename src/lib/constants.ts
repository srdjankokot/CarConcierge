import type { IconName } from "@/components/ui/Icon";
import type { ItemStatus, RequestStatus, ServiceType } from "@/types";

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  service: "Servis",
  technical: "Tehnički pregled",
  registration: "Registracija",
  tires: "Gume",
  wash: "Pranje / detailing",
  other: "Ostalo",
};

export const SERVICE_TYPE_OPTIONS = (Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map(
  (value) => ({ value, label: SERVICE_TYPE_LABEL[value] }),
);

// Ikona po tipu usluge (redesign: IconWell-ovi, kartice, New Request toggle-ovi).
export const SERVICE_TYPE_ICON: Record<ServiceType, IconName> = {
  service: "wrench",
  technical: "clipboard",
  registration: "check",
  tires: "tire",
  wash: "wash",
  other: "car",
};

// Ikona zahteva = ikona prve usluge.
export function requestIcon(services?: { type: ServiceType }[]): IconName {
  return SERVICE_TYPE_ICON[services?.[0]?.type ?? "other"] ?? "car";
}

// Boja status-pilule: mint za isporučeno/zatvoreno, warn za odbijeno/otkazano,
// inače akcenat uloge.
export function statusAccentVar(status: RequestStatus): string {
  if (status === "DELIVERED" || status === "CLOSED") return "var(--mint)";
  if (status === "REJECTED" || status === "CANCELLED") return "var(--warn)";
  return "var(--role-accent)";
}

// Linearni tok za stepper (terminalni REJECTED/CANCELLED se prikazuju zasebno).
export const STATUS_FLOW: RequestStatus[] = [
  "CREATED",
  "OFFER_SENT",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "AT_SERVICE",
  "SERVICE_DONE",
  "RETURNING",
  "DELIVERED",
  "CLOSED",
];

export type StatusTone = "neutral" | "active" | "done" | "warn";

export const STATUS_META: Record<RequestStatus, { label: string; tone: StatusTone }> = {
  CREATED: { label: "Zahtev poslat", tone: "neutral" },
  OFFER_SENT: { label: "Ponuda poslata", tone: "active" },
  CONFIRMED: { label: "Potvrđeno", tone: "active" },
  DRIVER_ASSIGNED: { label: "Vozač dodeljen", tone: "active" },
  PICKED_UP: { label: "Vozilo preuzeto", tone: "active" },
  AT_SERVICE: { label: "Na usluzi", tone: "active" },
  SERVICE_DONE: { label: "Usluga gotova", tone: "active" },
  RETURNING: { label: "Vraćanje", tone: "active" },
  DELIVERED: { label: "Isporučeno", tone: "done" },
  CLOSED: { label: "Zatvoreno", tone: "done" },
  REJECTED: { label: "Ponuda odbijena", tone: "warn" },
  CANCELLED: { label: "Otkazano", tone: "warn" },
};

export const TERMINAL_STATUSES: RequestStatus[] = ["CLOSED", "REJECTED", "CANCELLED"];

export function isActiveStatus(status: RequestStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

export function isClientCancelable(status: RequestStatus): boolean {
  return ["CREATED", "OFFER_SENT", "CONFIRMED", "DRIVER_ASSIGNED"].includes(status);
}

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  pending: "Na čekanju",
  at_servicer: "Kod servisera",
  done: "Gotovo",
};

export function formatRsd(amount: number): string {
  return `${new Intl.NumberFormat("sr-RS").format(amount)} RSD`;
}

export function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value; // slobodan tekst
    return new Intl.DateTimeFormat("sr-RS", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
  }
  const d =
    typeof (value as { toDate?: () => Date }).toDate === "function"
      ? (value as { toDate: () => Date }).toDate()
      : new Date(value as number | Date);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("sr-RS", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  const d = value ? new Date(value as string | number | Date) : null;
  return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
}

export function formatDate(value: unknown): string {
  // Firestore Timestamp ima toDate(); prihvati i Date/broj/string.
  const d =
    value && typeof (value as { toDate?: () => Date }).toDate === "function"
      ? (value as { toDate: () => Date }).toDate()
      : value
        ? new Date(value as string | number | Date)
        : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("sr-RS", { dateStyle: "medium" }).format(d);
}
