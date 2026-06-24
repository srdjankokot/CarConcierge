"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import type { ItemStatus, ServiceType } from "@/types";

export interface SendOfferInput {
  requestId: string;
  proposedTime: string;
  transportPrice: number;
  note?: string;
  services: {
    id?: string;
    type: ServiceType;
    label?: string;
    servicerChoice: "suggest" | "own";
    ownServicer?: { servicerId?: string; name: string; address: string; phone?: string };
    partnerRef?: { partnerId: string; name: string; address: string; phone: string };
  }[];
}

export const sendOfferCallable = httpsCallable<SendOfferInput, { ok: true }>(functions, "sendOffer");

export const assignDriverCallable = httpsCallable<
  { requestId: string; driverId: string },
  { ok: true }
>(functions, "assignDriver");

export const closeRequestCallable = httpsCallable<{ requestId: string }, { ok: true }>(
  functions,
  "closeRequest",
);

export const setItemStatusCallable = httpsCallable<
  { requestId: string; itemId: string; itemStatus: ItemStatus },
  { ok: true }
>(functions, "setItemStatus");

export const dispatcherCancelRequestCallable = httpsCallable<
  { requestId: string; reason?: string },
  { ok: true }
>(functions, "dispatcherCancelRequest");
