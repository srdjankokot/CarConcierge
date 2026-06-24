"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import type { CreateRequestInput } from "@/lib/validation/request";

export const createRequestCallable = httpsCallable<CreateRequestInput, { requestId: string }>(
  functions,
  "createRequest",
);

export const cancelRequestCallable = httpsCallable<
  { requestId: string; reason?: string },
  { ok: true }
>(functions, "cancelRequest");

export type OfferResponseAction = "accept" | "reject" | "request_change";

export const respondToOfferCallable = httpsCallable<
  { requestId: string; action: OfferResponseAction; reason?: string },
  { ok: true; status: string }
>(functions, "respondToOffer");
