"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import type { DriverNextStatus } from "./flow";

export const advanceJobStatusCallable = httpsCallable<
  { requestId: string; toStatus: DriverNextStatus },
  { ok: true; status: string }
>(functions, "advanceJobStatus");

export const addJobPhotoCallable = httpsCallable<
  { requestId: string; phase: "before" | "after"; url: string },
  { ok: true }
>(functions, "addJobPhoto");

export const revertJobStatusCallable = httpsCallable<
  { requestId: string },
  { ok: true; status: string }
>(functions, "revertJobStatus");
