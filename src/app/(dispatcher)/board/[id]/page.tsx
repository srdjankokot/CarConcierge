"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  ITEM_STATUS_LABEL,
  SERVICE_TYPE_LABEL,
  SERVICE_TYPE_OPTIONS,
  formatDateTime,
  formatRsd,
} from "@/lib/constants";
import {
  assignDriverCallable,
  closeRequestCallable,
  dispatcherCancelRequestCallable,
  sendOfferCallable,
  setItemStatusCallable,
  type SendOfferInput,
} from "@/lib/dispatch/api";
import { mapError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SearchIcon } from "@/components/ui/icons";
import { Logistics } from "@/components/requests/Logistics";
import { CommentsTimeline } from "@/components/requests/CommentsTimeline";
import { cn } from "@/lib/utils";
import type { CarRequest, ItemStatus, Partner, ServiceType, UserProfile } from "@/types";

type OfferServiceForm = {
  id?: string;
  type: ServiceType;
  label: string;
  servicerChoice: "suggest" | "own";
  partnerId: string;
  ownName: string;
  ownAddress: string;
  ownPhone: string;
};

const IN_PROGRESS = ["DRIVER_ASSIGNED", "PICKED_UP", "AT_SERVICE", "SERVICE_DONE", "RETURNING", "DELIVERED"];

export default function DispatcherRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [request, setRequest] = useState<CarRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Forma ponude
  const offerInit = useRef(false);
  const [offerServices, setOfferServices] = useState<OfferServiceForm[]>([]);
  const [proposedTime, setProposedTime] = useState("");
  const [transportPrice, setTransportPrice] = useState("");
  const [note, setNote] = useState("");
  const [driverId, setDriverId] = useState("");

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

  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "partners"), (snap) =>
      setPartners(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Partner, "id">) }))),
    );
    const unsubD = onSnapshot(query(collection(db, "users"), where("role", "==", "driver")), (snap) =>
      setDrivers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, "uid">) }))),
    );
    return () => {
      unsubP();
      unsubD();
    };
  }, []);

  // Inicijalizuj formu ponude jednom, iz zahteva (kad je CREATED).
  useEffect(() => {
    if (request && request.status === "CREATED" && !offerInit.current) {
      offerInit.current = true;
      setOfferServices(
        request.services.map((s) => ({
          id: s.id,
          type: s.type,
          label: s.label ?? "",
          servicerChoice: s.servicerChoice,
          partnerId: s.partnerRef?.partnerId ?? "",
          ownName: s.ownServicer?.name ?? "",
          ownAddress: s.ownServicer?.address ?? "",
          ownPhone: s.ownServicer?.phone ?? "",
        })),
      );
    }
  }, [request]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={26} className="text-accent" />
      </div>
    );
  }
  if (notFound || !request) {
    return <EmptyState icon={<SearchIcon className="h-7 w-7 text-accent" />} title="Zahtev nije pronađen" />;
  }

  const { vehicle, services, offer, status } = request;
  const activeDrivers = drivers.filter((d) => d.isActive !== false);
  const canCancel = [
    "CREATED",
    "OFFER_SENT",
    "CONFIRMED",
    "DRIVER_ASSIGNED",
    "PICKED_UP",
    "AT_SERVICE",
    "SERVICE_DONE",
    "RETURNING",
  ].includes(status);

  function patchOfferService(idx: number, patch: Partial<OfferServiceForm>) {
    setOfferServices((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  async function handleSendOffer() {
    if (busy) return;
    setError("");
    const price = Number(transportPrice);
    if (!proposedTime) return setError("Unesite predloženi termin.");
    if (!Number.isFinite(price) || price <= 0) return setError("Cena prevoza mora biti veća od 0.");
    for (const s of offerServices) {
      if (s.servicerChoice === "suggest" && !s.partnerId)
        return setError("Izaberite partnera za svaku 'predložite vi' stavku.");
      if (s.servicerChoice === "own" && (!s.ownName.trim() || !s.ownAddress.trim()))
        return setError("Za 'moj serviser' stavke unesite naziv i adresu.");
    }
    const payloadServices: SendOfferInput["services"] = offerServices.map((s) => {
      const partner = partners.find((p) => p.id === s.partnerId);
      return {
        id: s.id,
        type: s.type,
        label: s.type === "other" ? s.label.trim() || undefined : undefined,
        servicerChoice: s.servicerChoice,
        ownServicer:
          s.servicerChoice === "own"
            ? { name: s.ownName.trim(), address: s.ownAddress.trim(), phone: s.ownPhone.trim() || undefined }
            : undefined,
        partnerRef:
          s.servicerChoice === "suggest" && partner
            ? { partnerId: partner.id!, name: partner.name, address: partner.address, phone: partner.phone }
            : undefined,
      };
    });
    setBusy(true);
    try {
      await sendOfferCallable({
        requestId: request!.id!,
        proposedTime,
        transportPrice: price,
        note: note.trim() || undefined,
        services: payloadServices,
      });
    } catch (e) {
      setError(mapError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign() {
    if (busy) return;
    setError("");
    if (!driverId) return setError("Izaberite vozača.");
    setBusy(true);
    try {
      await assignDriverCallable({ requestId: request!.id!, driverId });
    } catch (e) {
      setError(mapError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await closeRequestCallable({ requestId: request!.id! });
    } catch (e) {
      setError(mapError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(reason?: string) {
    if (cancelBusy || !request?.id) return;
    setCancelBusy(true);
    setCancelError("");
    try {
      await dispatcherCancelRequestCallable({ requestId: request.id, reason });
      setShowCancel(false);
    } catch (e) {
      setCancelError(mapError(e));
    } finally {
      setCancelBusy(false);
    }
  }

  async function handleItemStatus(itemId: string, itemStatus: ItemStatus) {
    setError("");
    try {
      await setItemStatusCallable({ requestId: request!.id!, itemId, itemStatus });
    } catch (e) {
      setError(mapError(e));
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {vehicle.make} {vehicle.model} · {vehicle.year}
          </h1>
          {vehicle.plate ? <p className="font-mono text-xs text-text-faint">{vehicle.plate}</p> : null}
        </div>
        <StatusBadge status={status} />
      </div>

      {error ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-dim">Status</h2>
            <StatusStepper status={status} />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Klijent</h2>
            <p className="mt-2 text-sm font-medium">{request.clientName || "—"}</p>
            {request.clientPhone ? (
              <a href={`tel:${request.clientPhone}`} className="font-mono text-sm text-accent">
                {request.clientPhone}
              </a>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Logistika</h2>
            <Logistics request={request} />
          </Card>

          {request.assignedDriver ? (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Vozač</h2>
              <p className="mt-2 text-sm font-medium">{request.assignedDriver.name}</p>
              <a href={`tel:${request.assignedDriver.phone}`} className="font-mono text-sm text-accent">
                {request.assignedDriver.phone}
              </a>
            </Card>
          ) : null}

          <CommentsTimeline requestId={request.id!} />
        </div>

        <div className="flex flex-col gap-6">
          {/* Klijent tražio izmenu prethodne ponude */}
          {status === "CREATED" && request.changeRequestNote ? (
            <Card className="border-[#e0954a]/50 bg-[#e0954a]/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#e0954a]">
                Klijent traži izmenu
              </h2>
              <p className="mt-2 text-sm">{request.changeRequestNote}</p>
            </Card>
          ) : null}

          {/* CREATED → sastavljanje ponude */}
          {status === "CREATED" ? (
            <Card className="border-accent/40">
              <h2 className="text-lg font-semibold">Sastavi ponudu</h2>
              <div className="mt-4 flex flex-col gap-3">
                {offerServices.map((s, idx) => (
                  <div key={idx} className="flex flex-col gap-3 rounded-lg border border-border-soft bg-bg-2 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Usluga {idx + 1}</span>
                      {offerServices.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setOfferServices((arr) => arr.filter((_, i) => i !== idx))}
                          className="text-sm text-text-dim hover:text-danger"
                        >
                          Ukloni
                        </button>
                      ) : null}
                    </div>
                    <Select
                      label="Tip"
                      value={s.type}
                      onChange={(e) => patchOfferService(idx, { type: e.target.value as ServiceType })}
                      options={SERVICE_TYPE_OPTIONS}
                    />
                    {s.type === "other" ? (
                      <Input label="Opis" value={s.label} onChange={(e) => patchOfferService(idx, { label: e.target.value })} />
                    ) : null}
                    <div className="flex gap-2">
                      {(["suggest", "own"] as const).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => patchOfferService(idx, { servicerChoice: choice })}
                          className={cn(
                            "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                            s.servicerChoice === choice ? "border-accent text-text" : "border-border-soft text-text-dim",
                          )}
                        >
                          {choice === "suggest" ? "Vaš predlog" : "Klijentov serviser"}
                        </button>
                      ))}
                    </div>
                    {s.servicerChoice === "suggest" ? (
                      <Select
                        label="Partner"
                        value={s.partnerId}
                        onChange={(e) => patchOfferService(idx, { partnerId: e.target.value })}
                        options={[
                          { value: "", label: "— Izaberi partnera —" },
                          ...partners
                            .filter((p) => p.isActive !== false && (p.serviceTypes ?? []).includes(s.type))
                            .map((p) => ({ value: p.id!, label: `${p.name} (${p.address})` })),
                        ]}
                      />
                    ) : (
                      <div className="text-sm text-text-dim">
                        {s.ownName || "—"}
                        {s.ownAddress ? `, ${s.ownAddress}` : ""}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setOfferServices((arr) => [
                      ...arr,
                      { type: "service", label: "", servicerChoice: "suggest", partnerId: "", ownName: "", ownAddress: "", ownPhone: "" },
                    ])
                  }
                  className="self-start text-sm text-accent"
                >
                  + Dodaj stavku
                </button>

                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Predloženi termin"
                    type="datetime-local"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                  />
                  <Input
                    label="Cena prevoza (RSD)"
                    type="number"
                    inputMode="numeric"
                    value={transportPrice}
                    onChange={(e) => setTransportPrice(e.target.value)}
                  />
                </div>
                <Textarea label="Napomena (opciono)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button onClick={handleSendOffer} loading={busy}>
                  Pošalji ponudu
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Ponuda (read-only) za OFFER_SENT i kasnije */}
          {offer && status !== "CREATED" ? (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">Ponuda</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Row label="Termin" value={formatDateTime(offer.proposedTime)} />
                <Row label="Cena prevoza" value={formatRsd(offer.transportPrice)} />
                {offer.note ? <Row label="Napomena" value={offer.note} /> : null}
              </div>
              {status === "OFFER_SENT" ? (
                <p className="mt-3 text-sm text-text-dim">Čeka se odgovor klijenta…</p>
              ) : null}
              {status === "REJECTED" && request.rejectionReason ? (
                <p className="mt-3 text-sm text-[#e0954a]">Razlog odbijanja: {request.rejectionReason}</p>
              ) : null}
            </Card>
          ) : null}

          {/* CONFIRMED → dodela vozača */}
          {status === "CONFIRMED" ? (
            <Card className="border-accent/40">
              <h2 className="text-lg font-semibold">Dodeli vozača</h2>
              <div className="mt-4 flex flex-col gap-3">
                <Select
                  label="Aktivni vozači"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  options={[
                    { value: "", label: "— Izaberi vozača —" },
                    ...activeDrivers.map((d) => ({ value: d.uid, label: `${d.fullName} · ${d.phone}` })),
                  ]}
                />
                {activeDrivers.length === 0 ? (
                  <p className="text-sm text-text-dim">Nema aktivnih vozača — dodajte ih na stranici Vozači.</p>
                ) : null}
                <Button onClick={handleAssign} loading={busy} disabled={activeDrivers.length === 0}>
                  Dodeli vozača
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Usluge + (u toku) vođenje statusa po stavci */}
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
                      : "partner nije izabran";
                return (
                  <li key={s.id} className="rounded-lg border border-border-soft bg-bg-2 px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">
                        {SERVICE_TYPE_LABEL[s.type]}
                        {s.type === "other" && s.label ? `: ${s.label}` : ""}
                      </div>
                      {IN_PROGRESS.includes(status) ? (
                        <select
                          value={s.itemStatus ?? "pending"}
                          onChange={(e) => handleItemStatus(s.id, e.target.value as ItemStatus)}
                          className="input w-auto py-1 text-xs"
                        >
                          {(Object.keys(ITEM_STATUS_LABEL) as ItemStatus[]).map((k) => (
                            <option key={k} value={k}>
                              {ITEM_STATUS_LABEL[k]}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                    <div className="text-text-dim">{dest}</div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* DELIVERED → zatvori posao */}
          {status === "DELIVERED" ? (
            <Button onClick={handleClose} loading={busy} className="self-start">
              Zatvori posao
            </Button>
          ) : null}

          {canCancel ? (
            <div>
              <Button variant="ghost" onClick={() => setShowCancel(true)}>
                Otkaži posao
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={showCancel}
        title="Otkazati posao?"
        description="Posao se otkazuje; klijent dobija obaveštenje."
        confirmLabel="Otkaži posao"
        withReason
        loading={cancelBusy}
        error={cancelError}
        onConfirm={handleCancel}
        onClose={() => {
          setShowCancel(false);
          setCancelError("");
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
