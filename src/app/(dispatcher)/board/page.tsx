"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SERVICE_TYPE_LABEL, requestIcon, toMillis } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import type { CarRequest, RequestStatus } from "@/types";

const COLS: { key: string; label: string; st: RequestStatus[]; c: string }[] = [
  { key: "new", label: "Novi", st: ["CREATED"], c: "var(--brass)" },
  { key: "offer", label: "Ponuda", st: ["OFFER_SENT"], c: "var(--brass-soft)" },
  { key: "confirmed", label: "Potvrđeni", st: ["CONFIRMED", "DRIVER_ASSIGNED"], c: "var(--mint)" },
  { key: "progress", label: "U toku", st: ["PICKED_UP", "AT_SERVICE", "SERVICE_DONE", "RETURNING", "DELIVERED"], c: "var(--mint)" },
  { key: "done", label: "Završeni", st: ["CLOSED"], c: "var(--text-dim)" },
];

export default function DispatcherBoardPage() {
  const [requests, setRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "requests"),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarRequest, "id">) }));
        rows.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setRequests(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      <div className="rd-rise" style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-.8px", margin: "0 0 4px" }}>
          Tabla
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-dim)", margin: 0 }}>Svi zahtevi po statusu — klik otvara detalj.</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <Spinner size={26} className="text-accent" />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, minWidth: 880 }}>
            {COLS.map((col, ci) => {
              const items = requests.filter((r) => col.st.includes(r.status));
              return (
                <div key={col.key} className="glass-soft rd-rise" style={{ padding: 12, animationDelay: `${ci * 0.06}s`, minHeight: 120 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 2px" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.c, boxShadow: `0 0 8px ${col.c}` }} />
                      {col.label}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--text-dim)" }}>
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {items.length === 0 ? (
                      <p style={{ borderRadius: 12, border: "1px dashed var(--glass-line)", padding: "18px 6px", textAlign: "center", fontSize: 11, color: "var(--text-faint)", margin: 0 }}>—</p>
                    ) : (
                      items.map((r) => <BoardCard key={r.id} request={r} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BoardCard({ request }: { request: CarRequest }) {
  return (
    <Link
      href={`/board/${request.id}`}
      className="rd-card-hover"
      style={{ display: "block", cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-line)", borderRadius: 14, padding: 12, color: "inherit" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--brass)", background: "rgba(201,168,106,0.1)", flexShrink: 0 }}>
          <Icon name={requestIcon(request.services)} size={15} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {request.vehicle.make} {request.vehicle.model}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {request.clientName || "Klijent"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {request.services.slice(0, 2).map((s) => (
          <span key={s.id} style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--text-faint)" }}>
            {SERVICE_TYPE_LABEL[s.type]}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", marginTop: 8 }}>
        {request.pickup.timeWindow.date} · {request.pickup.timeWindow.from}
      </div>
    </Link>
  );
}
