"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { addJobPhotoCallable } from "@/lib/driver/api";
import { mapError } from "@/lib/auth/errors";

type ItemStatus = "compressing" | "uploading" | "saving" | "done" | "error";
interface Item {
  id: string;
  preview: string;
  status: ItemStatus;
  progress: number;
  error?: string;
  file: File;
}

const STATUS_LABEL: Record<ItemStatus, string> = {
  compressing: "Kompresujem…",
  uploading: "Otpremanje…",
  saving: "Čuvam…",
  done: "Otpremljeno ✓",
  error: "Greška",
};

export function PhotoUploader({
  requestId,
  phase,
}: {
  requestId: string;
  phase: "before" | "after";
}) {
  const [items, setItems] = useState<Item[]>([]);

  function patch(id: string, p: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }

  async function upload(file: File, id: string) {
    try {
      patch(id, { status: "compressing", progress: 0, error: undefined });
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      patch(id, { status: "uploading" });
      const path = `requests/${requestId}/${phase}/${Date.now()}_${id}.jpg`;
      const task = uploadBytesResumable(storageRef(storage, path), compressed, {
        contentType: compressed.type || "image/jpeg",
      });
      task.on(
        "state_changed",
        (snap) => patch(id, { progress: Math.round((snap.bytesTransferred / snap.totalBytes) * 100) }),
        (err) => patch(id, { status: "error", error: mapError(err) }),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            patch(id, { status: "saving" });
            // Status posla se NE menja ovde — tek kad je URL upisan na zahtev (sekcija 10).
            await addJobPhotoCallable({ requestId, phase, url });
            patch(id, { status: "done", progress: 100 });
          } catch (e) {
            patch(id, { status: "error", error: mapError(e) });
          }
        },
      );
    } catch (e) {
      patch(id, { status: "error", error: mapError(e) });
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const id = crypto.randomUUID();
      setItems((prev) => [
        ...prev,
        { id, preview: URL.createObjectURL(file), status: "compressing", progress: 0, file },
      ]);
      void upload(file, id);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="btn-ghost w-full cursor-pointer">
        + Dodaj fotografije
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </label>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {items.map((it) => (
            <div key={it.id} className="w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" className="h-24 w-24 rounded-lg border border-border-soft object-cover" />
              <div
                className={
                  it.status === "error"
                    ? "mt-1 text-xs text-danger"
                    : it.status === "done"
                      ? "mt-1 text-xs text-mint"
                      : "mt-1 text-xs text-text-dim"
                }
              >
                {it.status === "uploading" ? `${STATUS_LABEL.uploading} ${it.progress}%` : STATUS_LABEL[it.status]}
              </div>
              {it.status === "error" ? (
                <button onClick={() => void upload(it.file, it.id)} className="text-xs text-accent">
                  Pokušaj ponovo
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
