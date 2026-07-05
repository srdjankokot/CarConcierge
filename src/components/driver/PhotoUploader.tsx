"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { addJobPhotoCallable } from "@/lib/driver/api";
import { mapError } from "@/lib/auth/errors";
import { PHOTO_SLOTS, normalizePhotos } from "@/lib/driver/photoSlots";
import { cn } from "@/lib/utils";
import type { JobPhoto } from "@/types";

type St = "compressing" | "uploading" | "saving" | "done" | "error";
interface Item {
  id: string;
  slot?: string;
  st: St;
  progress: number;
  error?: string;
  preview: string;
  file: File;
}

export function PhotoUploader({
  requestId,
  phase,
  existing,
}: {
  requestId: string;
  phase: "before" | "after";
  existing?: (string | JobPhoto)[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const persisted = normalizePhotos(existing);

  function patch(id: string, p: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }

  async function upload(file: File, id: string, slot?: string) {
    try {
      patch(id, { st: "compressing", progress: 0, error: undefined });
      const compressed = await imageCompression(file, { maxSizeMB: 1.2, maxWidthOrHeight: 1920, useWebWorker: true });
      patch(id, { st: "uploading" });
      const path = `requests/${requestId}/${phase}/${Date.now()}_${slot ?? "extra"}.jpg`;
      const task = uploadBytesResumable(storageRef(storage, path), compressed, { contentType: compressed.type || "image/jpeg" });
      task.on(
        "state_changed",
        (snap) => patch(id, { progress: Math.round((snap.bytesTransferred / snap.totalBytes) * 100) }),
        (err) => patch(id, { st: "error", error: mapError(err) }),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            patch(id, { st: "saving" });
            await addJobPhotoCallable({ requestId, phase, url, slot });
            patch(id, { st: "done", progress: 100 });
          } catch (e) {
            patch(id, { st: "error", error: mapError(e) });
          }
        },
      );
    } catch (e) {
      patch(id, { st: "error", error: mapError(e) });
    }
  }

  function captureSlot(slot: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const id = crypto.randomUUID();
      const item: Item = { id, slot, st: "compressing", progress: 0, preview: URL.createObjectURL(file), file };
      setItems((prev) => [...prev.filter((it) => it.slot !== slot), item]);
      void upload(file, id, slot);
    };
  }

  function captureExtra(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, st: "compressing", progress: 0, preview: URL.createObjectURL(file), file }]);
      void upload(file, id);
    }
  }

  const extraItems = items.filter((it) => !it.slot);
  const persistedExtras = persisted.filter((p) => !p.slot);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {PHOTO_SLOTS.map((s) => {
          const sess = items.find((it) => it.slot === s.key);
          const existUrl = persisted.find((p) => p.slot === s.key)?.url;
          const thumb = sess?.preview ?? existUrl;
          const done = sess ? sess.st === "done" : !!existUrl;
          const busy = sess && sess.st !== "done" && sess.st !== "error";
          const err = sess?.st === "error";
          return (
            <label
              key={s.key}
              className={cn(
                "relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-bg-2",
                done ? "border-mint" : err ? "border-danger" : s.required && !thumb ? "border-[color:var(--warn)]" : "border-border-soft",
              )}
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt={s.label} className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              <div
                className="relative z-10 flex flex-col items-center gap-1 px-1 text-center"
                style={thumb ? { color: "#fff", textShadow: "0 1px 5px rgba(0,0,0,.75)" } : { color: "var(--text-dim)" }}
              >
                {done ? (
                  <span className="text-lg text-mint" style={{ textShadow: "0 1px 5px rgba(0,0,0,.6)" }}>✓</span>
                ) : busy ? (
                  <span className="text-xs">{sess!.st === "uploading" ? `${sess!.progress}%` : "…"}</span>
                ) : (
                  <span className="text-xl">＋</span>
                )}
                <span className="text-[11px] font-medium leading-tight">{s.label}</span>
                {!thumb && s.required ? <span className="text-[9px] text-[color:var(--warn)]">obavezno</span> : null}
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={captureSlot(s.key)} />
            </label>
          );
        })}
      </div>

      <div>
        <label className="btn-ghost w-full cursor-pointer text-sm">
          + Dodatne fotografije
          <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={captureExtra} />
        </label>
        {extraItems.length || persistedExtras.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {persistedExtras.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.url} src={p.url} alt="" className="h-16 w-16 rounded-lg border border-border-soft object-cover" />
            ))}
            {extraItems.map((it) => (
              <div key={it.id} className="w-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="h-16 w-16 rounded-lg border border-border-soft object-cover" />
                <div className={cn("mt-0.5 text-[10px]", it.st === "error" ? "text-danger" : it.st === "done" ? "text-mint" : "text-text-dim")}>
                  {it.st === "uploading" ? `${it.progress}%` : it.st === "done" ? "✓" : it.st === "error" ? "greška" : "…"}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
