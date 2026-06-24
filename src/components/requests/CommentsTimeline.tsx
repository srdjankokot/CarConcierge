"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import type { RequestComment, Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = {
  client: "Klijent",
  dispatcher: "Dispečer",
  driver: "Vozač",
};

const ROLE_COLOR: Record<Role, string> = {
  client: "#c9a86a",
  dispatcher: "#6fd3a3",
  driver: "#a78bfa",
};

const KIND_LABEL: Record<RequestComment["kind"], string> = {
  offer: "uz ponudu",
  rejection: "odbijanje",
  change_request: "traženje izmene",
  cancel: "otkazivanje",
};

export function CommentsTimeline({ requestId }: { requestId: string }) {
  const [events, setEvents] = useState<RequestComment[]>([]);

  useEffect(() => {
    if (!requestId) return;
    const q = query(collection(db, "requests", requestId, "events"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RequestComment, "id">) }))),
      () => setEvents([]),
    );
    return () => unsub();
  }, [requestId]);

  if (events.length === 0) return null;

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Komunikacija</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {events.map((e) => (
          <li key={e.id} className="border-l-2 pl-3" style={{ borderColor: ROLE_COLOR[e.role] }}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="text-sm font-medium" style={{ color: ROLE_COLOR[e.role] }}>
                {ROLE_LABEL[e.role]}
                {e.name ? ` · ${e.name}` : ""}
                <span className="ml-1 font-normal text-text-faint">({KIND_LABEL[e.kind]})</span>
              </span>
              <span className="font-mono text-xs text-text-faint">{formatDateTime(e.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-sm">{e.text}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
