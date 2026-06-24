import type { RequestStatus } from "@/types";

export type DriverNextStatus =
  | "PICKED_UP"
  | "AT_SERVICE"
  | "SERVICE_DONE"
  | "RETURNING"
  | "DELIVERED";

// Sledeća akcija vozača po trenutnom statusu (phase = obavezna foto).
export const DRIVER_ACTION: Partial<
  Record<RequestStatus, { label: string; to: DriverNextStatus; phase?: "before" | "after" }>
> = {
  DRIVER_ASSIGNED: { label: "Preuzeo sam vozilo", to: "PICKED_UP", phase: "before" },
  PICKED_UP: { label: "Predao serviseru", to: "AT_SERVICE" },
  AT_SERVICE: { label: "Usluga gotova", to: "SERVICE_DONE" },
  SERVICE_DONE: { label: "Vozim nazad", to: "RETURNING" },
  RETURNING: { label: "Predao klijentu", to: "DELIVERED", phase: "after" },
};

const DRIVER_PREV: Partial<Record<RequestStatus, RequestStatus>> = {
  PICKED_UP: "DRIVER_ASSIGNED",
  AT_SERVICE: "PICKED_UP",
  SERVICE_DONE: "AT_SERVICE",
  RETURNING: "SERVICE_DONE",
  DELIVERED: "RETURNING",
};

export function canRevert(status: RequestStatus): boolean {
  return status in DRIVER_PREV;
}
