"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SERVICE_TYPE_LABEL, formatDateTime, formatRsd, isClientCancelable } from "@/lib/constants";
import {
  cancelRequestCallable,
  respondToOfferCallable,
  type OfferResponseAction,
} from "@/lib/requests/api";
import { mapError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/ui/icons";
import { Logistics } from "@/components/requests/Logistics";
import { CommentsTimeline } from "@/components/requests/CommentsTimeline";
import type { CarRequest } from "@/types";

type DialogKind = OfferResponseAction | "cancel" | null;

const DIALOG_META: Record<
  Exclude<DialogKind, null>,
  { title: string; description: string; confirmLabel: string; withReason: boolean }
> = {
  accept: {
    title: "Prihvatiti ponudu?",
    description: "Posao postaje aktivan i dispečer dodeljuje vozača.",
    confirmLabel: "Prihvati",
    withReason: false,
  },
  reject: {
    title: "Odbiti ponudu?",
    description: "Zahtev se zatvara kao odbijen.",
    confirmLabel: "Odbij",
    withReason: true,
  },
  request_change: {
    title: "Tražiti izmenu ponude?",
    description: "Zahtev se vraća dispečeru na doradu.",
    confirmLabel: "Pošalji",
    withReason: true,
  },
  cancel: {
    title: "Otkazati zahtev?",
    description: "Ova akcija se ne može opozvati.",
    confirmLabel: "Otkaži zahtev",
    withReason: true,
  },
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
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setRequest({ id: snap.id, ...(snap.data() as Omit<CarRequest, "id">) });
        }
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
      if (dialog === "cancel") {
        await cancelRequestCallable({ requestId: request.id, reason });
      } else {
        await respondToOfferCallable({ requestId: request.id, action: dialog, reason });
      }
      setDialog(null);
    } catch (e) {
      setActionError(mapError(e));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={26} className="text-accent" />
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-7 w-7 text-accent" />}
        title="Zahtev nije pronađen"
        description="Možda je uklonjen ili nemate pristup."
      />
    );
  }

  const { vehicle, services, offer, status } = request;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {vehicle.make} {vehicle.model} · {vehicle.year}
          </h1>
          {vehicle.plate ? <p className="font-mono text-xs text-text-faint">{vehicle.plate}</p> : null}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr]">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-dim">Status</h2>
          <StatusStepper status={status} />
        </Card>

        <div className="flex flex-col gap-6">
          {/* Ponuda */}
          {status === "OFFER_SENT" && offer ? (
            <Card className="border-accent/40">
              <h2 className="text-lg font-semibold">Ponuda</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Row label="Predloženi termin" value={formatDateTime(offer.proposedTime)} />
                <Row label="Cena prevoza" value={formatRsd(offer.transportPrice)} />
                {offer.note ? <Row label="Napomena" value={offer.note} /> : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => setDialog("accept")}>Prihvati</Button>
                <Button variant="ghost" onClick={() => setDialog("request_change")}>
                  Traži izmenu
                </Button>
                <Button variant="ghost" onClick={() => setDialog("reject")}>
                  Odbij
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Dodeljeni vozač */}
          {request.assignedDriver ? (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Vozač</h2>
              <p className="mt-2 text-sm font-medium">{request.assignedDriver.name}</p>
              <a href={`tel:${request.assignedDriver.phone}`} className="font-mono text-sm text-accent">
                {request.assignedDriver.phone}
              </a>
            </Card>
          ) : null}

          {/* Usluge */}
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Usluge</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {services.map((s) => {
                const dest =
                  s.servicerChoice === "own"
                    ? s.ownServicer
                      ? `${s.ownServicer.name}, ${s.ownServicer.address}`
                      : "—"
                    : s.partnerRef
                      ? `${s.partnerRef.name}, ${s.partnerRef.address}`
                      : "Predlog dispečera (čeka se ponuda)";
                return (
                  <li key={s.id} className="rounded-lg border border-border-soft bg-bg-2 px-3 py-2.5 text-sm">
                    <div className="font-medium">
                      {SERVICE_TYPE_LABEL[s.type]}
                      {s.type === "other" && s.label ? `: ${s.label}` : ""}
                    </div>
                    <div className="text-text-dim">{dest}</div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Logistika */}
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Logistika</h2>
            <Logistics request={request} />
          </Card>

          <CommentsTimeline requestId={request.id!} />

          {/* Foto (F4) */}
          {request.photosBefore?.length || request.photosAfter?.length ? (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Fotografije</h2>
              <PhotoRow title="Pre" urls={request.photosBefore} />
              <PhotoRow title="Posle" urls={request.photosAfter} />
            </Card>
          ) : null}

          {isClientCancelable(status) ? (
            <div>
              <Button variant="ghost" onClick={() => setDialog("cancel")}>
                Otkaži zahtev
              </Button>
            </div>
          ) : null}
        </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-text-dim">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function PhotoRow({ title, urls }: { title: string; urls?: string[] }) {
  if (!urls?.length) return null;
  return (
    <div className="mt-3">
      <div className="label">{title}</div>
      <div className="flex flex-wrap gap-2">
        {urls.map((u) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={u} src={u} alt={title} className="h-20 w-20 rounded-lg border border-border-soft object-cover" />
        ))}
      </div>
    </div>
  );
}
