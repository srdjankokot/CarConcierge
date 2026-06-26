"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  SERVICE_TYPE_LABEL,
  formatDateTime,
  formatRsd,
  isClientCancelable,
  requestIcon,
} from "@/lib/constants";
import {
  cancelRequestCallable,
  respondToOfferCallable,
  type OfferResponseAction,
} from "@/lib/requests/api";
import { mapError } from "@/lib/auth/errors";
import { Icon } from "@/components/ui/Icon";
import { IconWell } from "@/components/redesign/IconWell";
import { StatusPill } from "@/components/redesign/StatusPill";
import { Chip } from "@/components/redesign/Chip";
import { AnimatedStepper } from "@/components/redesign/AnimatedStepper";
import { PhotoGallery } from "@/components/redesign/PhotoGallery";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CommentsTimeline } from "@/components/requests/CommentsTimeline";
import { Spinner } from "@/components/ui/Spinner";
import type { CarRequest } from "@/types";

type DialogKind = OfferResponseAction | "cancel" | null;

const DIALOG_META: Record<
  Exclude<DialogKind, null>,
  { title: string; description: string; confirmLabel: string; withReason: boolean }
> = {
  accept: { title: "Prihvatiti ponudu?", description: "Posao postaje aktivan i dispečer dodeljuje vozača.", confirmLabel: "Prihvati", withReason: false },
  reject: { title: "Odbiti ponudu?", description: "Zahtev se zatvara kao odbijen.", confirmLabel: "Odbij", withReason: true },
  request_change: { title: "Tražiti izmenu ponude?", description: "Zahtev se vraća dispečeru na doradu.", confirmLabel: "Pošalji", withReason: true },
  cancel: { title: "Otkazati zahtev?", description: "Ova akcija se ne može opozvati.", confirmLabel: "Otkaži zahtev", withReason: true },
};

const sectionH: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".6px",
  color: "var(--text-dim)",
  margin: 0,
};

export default function ClientRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [request, setRequest] = useState<CarRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(
      doc(db, "requests", id),
      (snap) => {
        if (!snap.exists()) setNotFound(true);
        else setRequest({ id: snap.id, ...(snap.data() as Omit<CarRequest, "id">) });
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [id]);

  async function runAction(reason?: string) {
    if (!request?.id || !dialog) return;
    setActionLoading(true);
    setActionError("");
    try {
      if (dialog === "cancel") await cancelRequestCallable({ requestId: request.id, reason });
      else await respondToOfferCallable({ requestId: request.id, action: dialog, reason });
      setDialog(null);
    } catch (e) {
      setActionError(mapError(e));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <Spinner size={26} className="text-accent" />
      </div>
    );
  }
  if (notFound || !request) {
    return (
      <div className="glass" style={{ maxWidth: 600, margin: "0 auto", padding: 40, textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>Zahtev nije pronađen</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Možda je uklonjen ili nemate pristup.</p>
      </div>
    );
  }

  const { vehicle, pickup, services, offer, status } = request;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <Link href="/home" className="rd-rise" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-dim)", fontSize: 14, marginBottom: 18 }}>
        <Icon name="arrowLeft" size={16} /> Nazad
      </Link>

      <div className="rd-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 22, animationDelay: ".04s" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <IconWell name={requestIcon(services)} accent />
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-.8px", margin: 0 }}>
              {vehicle.make} {vehicle.model} · {vehicle.year}
            </h1>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>
              {vehicle.plate ? `${vehicle.plate} · ` : ""}Preuzimanje {pickup.timeWindow.date} · {pickup.timeWindow.from}–{pickup.timeWindow.to}
            </div>
          </div>
        </div>
        <StatusPill status={status} big />
      </div>

      {actionError && dialog === null ? (
        <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{actionError}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
        {/* Levo: tok zahteva */}
        <div className="glass rd-rise" style={{ padding: 26, animationDelay: ".1s" }}>
          <h2 style={{ ...sectionH, marginBottom: 18 }}>Tok zahteva</h2>
          <AnimatedStepper status={status} />
        </div>

        {/* Desno */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Ponuda (kad je poslata) */}
          {status === "OFFER_SENT" && offer ? (
            <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".14s", border: "1px solid color-mix(in srgb, var(--role-accent) 35%, transparent)" }}>
              <h2 style={{ ...sectionH, marginBottom: 12 }}>Ponuda</h2>
              <div className="rd-grad-text" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-1px" }}>
                {formatRsd(offer.transportPrice)}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-dim)", margin: "6px 0 4px" }}>
                Termin: {formatDateTime(offer.proposedTime)}
              </p>
              {offer.note ? <p style={{ fontSize: 12.5, color: "var(--text-dim)", margin: 0 }}>{offer.note}</p> : null}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                <button className="rd-btn" onClick={() => setDialog("accept")}>Prihvati</button>
                <button className="rd-btn-ghost" onClick={() => setDialog("request_change")}>Traži izmenu</button>
                <button className="rd-btn-ghost" onClick={() => setDialog("reject")}>Odbij</button>
              </div>
            </div>
          ) : (
            <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".14s" }}>
              <h2 style={{ ...sectionH, marginBottom: 12 }}>Cena prevoza</h2>
              <div className="rd-grad-text" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, letterSpacing: "-1px" }}>
                {offer ? formatRsd(offer.transportPrice) : "—"}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "8px 0 0" }}>Uslugu plaćate direktno serviseru.</p>
            </div>
          )}

          {/* Vozač */}
          {request.assignedDriver ? (
            <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".18s" }}>
              <h2 style={{ ...sectionH, marginBottom: 8 }}>Vozač</h2>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{request.assignedDriver.name}</p>
              <a href={`tel:${request.assignedDriver.phone}`} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--role-accent)" }}>
                {request.assignedDriver.phone}
              </a>
            </div>
          ) : null}

          {/* Usluge */}
          <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".22s" }}>
            <h2 style={{ ...sectionH, marginBottom: 12 }}>Usluge</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {services.map((s) => (
                <Chip key={s.id}>{SERVICE_TYPE_LABEL[s.type]}</Chip>
              ))}
            </div>
          </div>

          {/* Fotografije PRE/POSLE */}
          {request.photosBefore?.length || request.photosAfter?.length ? (
            <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".24s" }}>
              <h2 style={{ ...sectionH, marginBottom: 12 }}>Fotografije</h2>
              <PhotoGallery before={request.photosBefore} after={request.photosAfter} />
            </div>
          ) : null}

          <button className="rd-btn-ghost rd-rise" style={{ animationDelay: ".26s" }} disabled>
            <Icon name="headset" size={16} /> Kontakt dispečer
          </button>

          {isClientCancelable(status) ? (
            <button className="rd-rise" onClick={() => setDialog("cancel")} style={{ animationDelay: ".3s", background: "none", border: "none", color: "var(--text-dim)", fontSize: 13.5, cursor: "pointer", padding: "4px 0" }}>
              Otkaži zahtev
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <CommentsTimeline requestId={request.id!} />
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog ? DIALOG_META[dialog].title : ""}
        description={dialog ? DIALOG_META[dialog].description : ""}
        confirmLabel={dialog ? DIALOG_META[dialog].confirmLabel : ""}
        withReason={dialog ? DIALOG_META[dialog].withReason : false}
        loading={actionLoading}
        error={actionError}
        onConfirm={runAction}
        onClose={() => {
          setDialog(null);
          setActionError("");
        }}
      />
    </div>
  );
}
