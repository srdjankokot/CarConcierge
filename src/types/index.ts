// ─────────────────────────────────────────────────────────────────────────────
// Centralni model podataka (Firestore). Tipovi prate sekciju 4 specifikacije.
// U F1 se aktivno koriste Role i UserProfile; ostali tipovi su definisani odmah
// da model bude na jednom mestu i da F2–F4 grade na njima.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "client" | "dispatcher" | "driver";

export type RequestStatus =
  | "CREATED"
  | "OFFER_SENT"
  | "CONFIRMED"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "AT_SERVICE"
  | "SERVICE_DONE"
  | "RETURNING"
  | "DELIVERED"
  | "CLOSED"
  | "REJECTED"
  | "CANCELLED";

export type ServiceType =
  | "service"
  | "technical"
  | "registration"
  | "tires"
  | "wash"
  | "other";

export type ServicerChoice = "suggest" | "own";

export type ItemStatus = "pending" | "at_servicer" | "done";

// users/{uid}
export interface UserProfile {
  uid: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  createdAt?: unknown; // Firestore Timestamp
  fcmTokens?: string[];
  // samo za driver:
  isActive?: boolean;
}

// users/{uid}/vehicles/{vehicleId}
export interface Vehicle {
  id?: string;
  make: string;
  model: string;
  year: number;
  plate?: string;
  note?: string;
  createdAt?: unknown;
}

// users/{uid}/servicers/{servicerId}
export interface Servicer {
  id?: string;
  name: string;
  address: string;
  phone?: string;
  serviceTypes?: ServiceType[];
  createdAt?: unknown;
}

// partners/{partnerId}
export interface Partner {
  id?: string;
  name: string;
  address: string;
  phone: string;
  serviceTypes: ServiceType[];
  makes?: string[];
  note?: string;
  isActive: boolean;
  createdAt?: unknown;
}

export interface ServiceItem {
  id: string;
  type: ServiceType;
  label?: string;
  servicerChoice: ServicerChoice;
  ownServicer?: {
    servicerId?: string;
    name: string;
    address: string;
    phone?: string;
  };
  partnerRef?: {
    partnerId: string;
    name: string;
    address: string;
    phone: string;
  };
  itemStatus?: ItemStatus;
}

export interface TimeWindow {
  date: string; // 'YYYY-MM-DD'
  from: string; // 'HH:mm'
  to: string; // 'HH:mm'
}

export interface VehicleSnapshot {
  vehicleId?: string;
  make: string;
  model: string;
  year: number;
  plate?: string;
}

export interface Offer {
  proposedTime: string;
  transportPrice: number;
  note?: string;
  createdAt?: unknown;
  createdBy: string;
}

// requests/{requestId}
export interface CarRequest {
  id?: string;
  clientId: string;
  // snapshot kontakta klijenta (upisuje createRequest — za prikaz na tabli/detalju dispečera)
  clientName?: string;
  clientPhone?: string;
  status: RequestStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  vehicle: VehicleSnapshot;
  pickup: {
    address: string;
    lat?: number;
    lng?: number;
    timeWindow: TimeWindow;
  };
  dropoff: {
    address: string;
    lat?: number;
    lng?: number;
    sameAsPickup: boolean;
  };
  services: ServiceItem[];
  offer?: Offer;
  offerRespondedAt?: unknown;
  rejectionReason?: string;
  // komentar klijenta kad traži izmenu ponude (vraća zahtev dispečeru)
  changeRequestNote?: string;
  assignedDriverId?: string;
  // snapshot kontakta vozača (upisuje dispečer pri dodeli — klijent ne čita users/{driverId})
  assignedDriver?: {
    name: string;
    phone: string;
  };
  assignedAt?: unknown;
  photosBefore?: string[];
  photosAfter?: string[];
  cancelledBy?: "client" | "dispatcher";
  cancelReason?: string;
}

// requests/{id}/events — hronološki log komentara (auto-log akcija)
export interface RequestComment {
  id?: string;
  role: Role;
  name?: string;
  text: string;
  kind: "offer" | "rejection" | "change_request" | "cancel";
  createdAt?: unknown;
}

export type NotificationType =
  | "new_request"
  | "offer_sent"
  | "offer_responded"
  | "driver_assigned"
  | "status_changed";

// users/{uid}/notifications/{notifId}
export interface AppNotification {
  id?: string;
  type: NotificationType;
  requestId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: unknown;
}
