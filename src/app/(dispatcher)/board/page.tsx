"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { assignDriverCallable, closeRequestCallable, dispatcherCancelRequestCallable } from "@/lib/dispatch/api";
import { mapError } from "@/lib/auth/errors";
import { toBoardDriver, toBoardRequest, todayStr, type BoardDriver, type BoardRequest } from "@/lib/board/model";
import { Spinner } from "@/components/ui/Spinner";
import { Kpis } from "@/components/board/Kpis";
import { Switcher, type BoardView } from "@/components/board/Switcher";
import { DateNav } from "@/components/board/DateNav";
import { WorklistView } from "@/components/board/views/WorklistView";
import { TimelineView } from "@/components/board/views/TimelineView";
import { KanbanView } from "@/components/board/views/KanbanView";
import { DetailDrawer } from "@/components/board/DetailDrawer";
import type { CarRequest, UserProfile } from "@/types";

export default function DispatcherBoardPage() {
  const router = useRouter();
  const [allReqs, setAllReqs] = useState<BoardRequest[]>([]);
  const [drivers, setDrivers] = useState<BoardDriver[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<BoardView>("timeline");
  const [date, setDate] = useState(todayStr());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "requests"),
      (snap) => {
        setAllReqs(snap.docs.map((d) => toBoardRequest({ id: d.id, ...(d.data() as Omit<CarRequest, "id">) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "users"), where("role", "==", "driver")), (snap) => {
      const ds = snap.docs
        .map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, "uid">) }))
        .filter((u) => u.isActive !== false)
        .map(toBoardDriver);
      setDrivers(ds);
    });
    return () => unsub();
  }, []);

  const dayReqs = useMemo(() => allReqs.filter((r) => r.date === date), [allReqs, date]);
  const detailReq = allReqs.find((r) => r.id === detailId) || null;

  async function runAction(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    setError("");
    try {
      await fn();
      setFlashId(id);
      setTimeout(() => setFlashId((f) => (f === id ? null : f)), 1100);
    } catch (e) {
      setError(mapError(e));
    } finally {
      setBusyId((b) => (b === id ? null : b));
    }
  }

  const onAssign = (id: string, uid: string) => runAction(id, () => assignDriverCallable({ requestId: id, driverId: uid }));
  const onCloseJob = (id: string) => runAction(id, () => closeRequestCallable({ requestId: id }));
  const onCancel = (id: string) => {
    if (window.confirm("Otkazati posao? Klijent dobija obaveštenje.")) {
      setDetailId(null);
      runAction(id, () => dispatcherCancelRequestCallable({ requestId: id }));
    }
  };
  const onCompose = (id: string) => router.push(`/board/${id}`);
  const onOpenDetail = (id: string) => setDetailId(id);

  const subtitle =
    view === "timeline"
      ? "Raspored dana po vozaču — klik na blok otvara akcije i detalje."
      : view === "kanban"
        ? "Zahtevi grupisani po statusu — klik na karticu otvara detalje."
        : "Šta traži pažnju, sortirano po hitnosti.";

  return (
    <div data-role="dispatcher">
      <div className="rd-rise" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-.8px", margin: "0 0 5px" }}>Dispečerska tabla</h1>
          <p style={{ fontSize: 14, color: "var(--text-dim)", margin: 0 }}>{subtitle}</p>
        </div>
        <Switcher view={view} setView={setView} />
      </div>

      {error ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</p> : null}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <Spinner size={26} className="text-accent" />
        </div>
      ) : (
        <>
          <Kpis reqs={allReqs} />
          {view === "timeline" ? (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <DateNav date={date} setDate={setDate} />
              </div>
              <TimelineView reqs={dayReqs} date={date} drivers={drivers} busyId={busyId} onCompose={onCompose} onAssign={onAssign} onClose={onCloseJob} onOpenDetail={onOpenDetail} />
            </>
          ) : view === "kanban" ? (
            <KanbanView reqs={allReqs} drivers={drivers} flashId={flashId} onCompose={onCompose} onClose={onCloseJob} onOpenDetail={onOpenDetail} />
          ) : (
            <WorklistView reqs={allReqs} drivers={drivers} flashId={flashId} busyId={busyId} onCompose={onCompose} onAssign={onAssign} onClose={onCloseJob} onOpenDetail={onOpenDetail} />
          )}
        </>
      )}

      {detailReq ? (
        <DetailDrawer
          r={detailReq}
          drivers={drivers}
          busy={busyId === detailReq.id}
          onClose={() => setDetailId(null)}
          onAssign={onAssign}
          onCloseJob={onCloseJob}
          onCancel={onCancel}
        />
      ) : null}
    </div>
  );
}
