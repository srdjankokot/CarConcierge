import type { JobPhoto } from "@/types";

// Vođeno slikanje — standardni uglovi (isti PRE i POSLE, radi uporedivosti dokaza).
export interface PhotoSlot {
  key: string;
  label: string;
  required: boolean;
}

export const PHOTO_SLOTS: PhotoSlot[] = [
  { key: "front", label: "Prednja", required: true },
  { key: "rear", label: "Zadnja", required: true },
  { key: "left", label: "Leva strana", required: true },
  { key: "right", label: "Desna strana", required: true },
  { key: "front_corner", label: "Prednji ugao", required: false },
  { key: "rear_corner", label: "Zadnji ugao", required: false },
  { key: "odometer", label: "Kilometraža", required: false },
];

export const REQUIRED_SLOTS = PHOTO_SLOTS.filter((s) => s.required).map((s) => s.key);

export const SLOT_LABEL: Record<string, string> = Object.fromEntries(PHOTO_SLOTS.map((s) => [s.key, s.label]));

// Stare fotke su string (URL); nove su { url, slot }. Normalizuj u JobPhoto[].
export function normalizePhotos(arr?: (string | JobPhoto)[]): JobPhoto[] {
  return (arr ?? []).map((p) => (typeof p === "string" ? { url: p } : p));
}

export function filledSlots(arr?: (string | JobPhoto)[]): Set<string> {
  return new Set(normalizePhotos(arr).map((p) => p.slot).filter((s): s is string => !!s));
}

export function allRequiredFilled(arr?: (string | JobPhoto)[]): boolean {
  const done = filledSlots(arr);
  return REQUIRED_SLOTS.every((s) => done.has(s));
}
