"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toMillis } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { ServiceChips } from "@/components/ui/ServiceChips";
import { Spinner } from "@/components/ui/Spinner";
import type { CarRequest, RequestStatus } from "@/types";

const COLUMNS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  { key: "new", label: "Novi", statuses: ["CREATED"] },
  { key: "offer", label: "Ponuda poslata", statuses: ["OFFER_SENT"] },
  { key: "confirmed", label: "Potvrđeni", statuses: ["CONFIRMED"] },
  {
    key: "progress",
    label: "U toku",
    statuses: ["DRIVER_ASSIGNED", "PICKED_UP", "AT_SERVICE", "SERVICE_DONE", "RETURNING", "DELIVERED"],
  },
  { key: "done", label: "Završeni", statuses: ["CLOSED"] },
];

export default function DispatcherBoardPage() {
  const [requests, setRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyWaiting, setOnlyWaiting] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

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

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (onlyWaiting && r.status !== "CREATED") return false;
        if (dateFilter && r.pickup.timeWindow.date !== dateFilter) return false;
        return true;
      }),
    [requests, onlyWaiting, dateFilter],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tabla</h1>
          <p className="mt-1 text-sm text-text-dim">Svi zahtevi po statusu — klik otvara detalj.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-dim">
            <input type="checkbox" checked={onlyWaiting} onChange={(e) => setOnlyWaiting(e.target.checked)} />
            Samo čekaju ponudu
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input w-auto"
            aria-label="Filter po datumu preuzimanja"
          />
          {dateFilter ? (
            <button onClick={() => setDateFilter("")} className="text-sm text-text-dim hover:text-text">
              Očisti
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={26} className="text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = filtered.filter((r) => col.statuses.includes(r.status));
            return (
              <div key={col.key} className="rounded-card border border-border-soft bg-surface/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="badge">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-xs text-text-faint">
                      Nema zahteva
                    </p>
                  ) : (
                    items.map((r) => <BoardCard key={r.id} request={r} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BoardCard({ request }: { request: CarRequest }) {
  const needsOffer = request.status === "CREATED";
  return (
    <Link href={`/board/${request.id}`} className="block">
      <Card className="p-3 transition-colors hover:border-accent">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-medium">
            {request.vehicle.make} {request.vehicle.model}
          </div>
          {needsOffer ? (
            <span className={`badge ${request.changeRequestNote ? "text-[#e0954a]" : "text-accent"}`}>
              {request.changeRequestNote ? "izmena" : "čeka ponudu"}
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-xs text-text-dim">{request.clientName || "Klijent"}</div>
        <div className="mt-2">
          <ServiceChips services={request.services} />
        </div>
        <div className="mt-2 font-mono text-xs text-text-faint">
          {request.pickup.timeWindow.date} · {request.pickup.timeWindow.from}–{request.pickup.timeWindow.to}
        </div>
      </Card>
    </Link>
  );
}
