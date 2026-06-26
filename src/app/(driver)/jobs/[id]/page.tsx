"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SERVICE_TYPE_LABEL, requestIcon } from "@/lib/constants";
import { DRIVER_ACTION, canRevert, type DriverNextStatus } from "@/lib/driver/flow";
import { advanceJobStatusCallable, revertJobStatusCallable } from "@/lib/driver/api";
import { mapError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowLeftIcon, SearchIcon } from "@/components/ui/icons";
import { IconWell } from "@/components/redesign/IconWell";
import { StatusPill } from "@/components/redesign/StatusPill";
import { AnimatedStepper } from "@/components/redesign/AnimatedStepper";
import { PhotoUploader } from "@/components/driver/PhotoUploader";
import { Logistics } from "@/components/requests/Logistics";
import type { CarRequest } from "@/types";

export default function DriverJobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [job, setJob] = useState<CarRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(
      doc(db, "requests", id),
      (snap) => {
        if (!snap.exists()) setNotFound(true);
        else setJob({ id: snap.id, ...(snap.data() as Omit<CarRequest, "id">) });
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [id]);

  async function advance(to: DriverNextStatus) {
    if (busy || !job?.id) return;
    setBusy(true);
    setError("");
    try {
      await advanceJobStatusCallable({ requestId: job.id, toStatus: to });
    } catch (e) {
      setError(mapError(e));
    } finally {
      setBusy(false);
    }
  }

  async function revert() {
    if (reverting || !job?.id) return;
    setReverting(true);
    setError("");
    try {
      await revertJobStatusCallable({ requestId: job.id });
    } catch (e) {
      setError(mapError(e));
    } finally {
      setReverting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={26} className="text-accent" />
      </div>
    );
  }
  if (notFound || !job) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-7 w-7 text-accent" />}
        title="Posao nije pronađen"
        description="Možda niste dodeljeni na ovaj posao."
      />
    );
  }

  const { vehicle, services, status } = job;
  const action = DRIVER_ACTION[status];
  const phasePhotos = action?.phase === "before" ? job.photosBefore : job.photosAfter;
  const blockedByPhoto = !!action?.phase && (phasePhotos?.length ?? 0) === 0;
  const showBar = !!action || canRevert(status);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <IconWell name={requestIcon(services)} accent />
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, letterSpacing: "-.8px", margin: 0 }}>
              {vehicle.make} {vehicle.model} · {vehicle.year}
            </h1>
            {vehicle.plate ? <p className="mt-1 font-mono text-xs text-text-faint">{vehicle.plate}</p> : null}
          </div>
        </div>
        <StatusPill status={status} big />
      </div>

      {error ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        {/* LEVO: status + klijent */}
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-dim">Status</h2>
            <AnimatedStepper status={status} />
          </Card>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Klijent</h2>
            <p className="mt-2 text-sm font-medium">{job.clientName || "—"}</p>
            {job.clientPhone ? (
              <a href={`tel:${job.clientPhone}`} className="font-mono text-sm text-accent">
                {job.clientPhone}
              </a>
            ) : null}
          </Card>
        </div>

        {/* DESNO: foto (ako faza traži) + terenske info */}
        <div className="flex flex-col gap-6">
          {action?.phase ? (
            <Card className="border-accent/40">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">
                {action.phase === "before" ? "Foto PRE preuzimanja" : "Foto POSLE (vraćanje)"}
              </h2>
              <p className="mb-3 mt-1 text-xs text-text-dim">Obavezna bar jedna fotografija pre nastavka.</p>
              <PhotoGallery urls={phasePhotos} />
              <div className="mt-3">
                <PhotoUploader requestId={job.id!} phase={action.phase} />
              </div>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Logistika</h2>
            <Logistics request={job} />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Destinacije</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {services.map((s) => {
                const dest = s.servicerChoice === "own" ? s.ownServicer : s.partnerRef;
                const phone = s.servicerChoice === "own" ? s.ownServicer?.phone : s.partnerRef?.phone;
                return (
                  <li key={s.id} className="rounded-lg border border-border-soft bg-bg-2 px-3 py-2.5 text-sm">
                    <div className="font-medium">
                      {SERVICE_TYPE_LABEL[s.type]}
                      {s.type === "other" && s.label ? `: ${s.label}` : ""}
                    </div>
                    <div className="text-text-dim">{dest ? `${dest.name}, ${dest.address}` : "—"}</div>
                    {phone ? (
                      <a href={`tel:${phone}`} className="font-mono text-xs text-accent">
                        {phone}
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Card>

          {job.photosBefore?.length || job.photosAfter?.length ? (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Fotografije</h2>
              <div className="mt-3 flex flex-col gap-3">
                <PhotoGallery title="Pre" urls={job.photosBefore} />
                <PhotoGallery title="Posle" urls={job.photosAfter} />
              </div>
            </Card>
          ) : null}

          {status === "DELIVERED" ? (
            <p className="text-sm text-text-dim">Vozilo isporučeno. Čeka se zatvaranje od strane dispečera.</p>
          ) : status === "CLOSED" ? (
            <p className="text-sm text-mint">Posao je zatvoren. Hvala!</p>
          ) : status === "CANCELLED" ? (
            <p className="text-sm text-[#e0954a]">Posao je otkazan.</p>
          ) : null}
        </div>
      </div>

      {/* Sticky akciona traka — uvek dostupna, bez skrolovanja */}
      {showBar ? (
        <div className="sticky bottom-0 z-40 -mx-5 mt-2 border-t border-[color:var(--glass-line)] bg-[#0a110d]/85 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            {canRevert(status) ? (
              <Button variant="ghost" loading={reverting} onClick={revert} className="shrink-0">
                <ArrowLeftIcon className="h-4 w-4" />
                Nazad
              </Button>
            ) : null}
            {action ? (
              <Button
                fullWidth
                className="py-3.5 text-base"
                loading={busy}
                disabled={blockedByPhoto}
                onClick={() => advance(action.to)}
              >
                {action.label}
              </Button>
            ) : null}
          </div>
          {blockedByPhoto ? (
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-text-faint">
              Dodajte fotografiju da nastavite.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PhotoGallery({ title, urls }: { title?: string; urls?: string[] }) {
  if (!urls?.length) return null;
  return (
    <div>
      {title ? <div className="label">{title}</div> : null}
      <div className="flex flex-wrap gap-2">
        {urls.map((u) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={u} src={u} alt={title ?? "foto"} className="h-20 w-20 rounded-lg border border-border-soft object-cover" />
        ))}
      </div>
    </div>
  );
}
