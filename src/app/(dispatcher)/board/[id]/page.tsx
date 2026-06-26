"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  ITEM_STATUS_LABEL,
  SERVICE_TYPE_LABEL,
  SERVICE_TYPE_OPTIONS,
  formatDateTime,
  formatRsd,
  requestIcon,
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
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { IconWell } from "@/components/redesign/IconWell";
import { StatusPill } from "@/components/redesign/StatusPill";
import { AnimatedStepper } from "@/components/redesign/AnimatedStepper";
import { PhotoGallery } from "@/components/redesign/PhotoGallery";
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

const sectionH: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".6px",
  color: "var(--text-dim)",
  margin: 0,
};
const cardTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 17,
  fontWeight: 600,
  margin: 0,
};

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
    return (
      <div className="glass" style={{ maxWidth: 600, margin: "0 auto", padding: 40, textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>Zahtev nije pronađen</h2>
      </div>
    );
  }

  const { vehicle, pickup, services, offer, status } = request;
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
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      <Link href="/board" className="rd-rise" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-dim)", fontSize: 14, marginBottom: 18 }}>
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

      {error ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.55fr]">
        {/* LEVO: status + info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass rd-rise" style={{ padding: 24, animationDelay: ".1s" }}>
            <h2 style={{ ...sectionH, marginBottom: 18 }}>Tok zahteva</h2>
            <AnimatedStepper status={status} />
          </div>

          <div className="glass-soft rd-rise" style={{ padding: 20, animationDelay: ".14s" }}>
            <h2 style={{ ...sectionH, marginBottom: 8 }}>Klijent</h2>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{request.clientName || "—"}</p>
            {request.clientPhone ? (
              <a href={`tel:${request.clientPhone}`} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--role-accent)" }}>
                {request.clientPhone}
              </a>
            ) : null}
          </div>

          <div className="glass-soft rd-rise" style={{ padding: 20, animationDelay: ".18s" }}>
            <h2 style={{ ...sectionH }}>Logistika</h2>
            <Logistics request={request} />
          </div>

          {request.assignedDriver ? (
            <div className="glass-soft rd-rise" style={{ padding: 20, animationDelay: ".22s" }}>
              <h2 style={{ ...sectionH, marginBottom: 8 }}>Vozač</h2>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{request.assignedDriver.name}</p>
              <a href={`tel:${request.assignedDriver.phone}`} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--role-accent)" }}>
                {request.assignedDriver.phone}
              </a>
            </div>
          ) : null}

          {request.photosBefore?.length || request.photosAfter?.length ? (
            <div className="glass-soft rd-rise" style={{ padding: 20, animationDelay: ".24s" }}>
              <h2 style={{ ...sectionH, marginBottom: 12 }}>Fotografije</h2>
              <PhotoGallery before={request.photosBefore} after={request.photosAfter} />
            </div>
          ) : null}

          <CommentsTimeline requestId={request.id!} />
        </div>

        {/* DESNO: akcije */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {status === "CREATED" && request.changeRequestNote ? (
            <div className="glass-soft rd-rise" style={{ padding: 20, border: "1px solid color-mix(in srgb, var(--warn) 45%, transparent)", background: "color-mix(in srgb, var(--warn) 8%, transparent)" }}>
              <h2 style={{ ...sectionH, color: "var(--warn)" }}>Klijent traži izmenu</h2>
              <p style={{ marginTop: 8, fontSize: 14 }}>{request.changeRequestNote}</p>
            </div>
          ) : null}

          {/* CREATED → sastavljanje ponude */}
          {status === "CREATED" ? (
            <div className="glass rd-rise" style={{ padding: 24, border: "1px solid color-mix(in srgb, var(--role-accent) 35%, transparent)" }}>
              <h2 style={cardTitle}>Sastavi ponudu</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                {offerServices.map((s, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 12, borderRadius: 14, border: "1px solid var(--glass-line)", background: "rgba(255,255,255,0.03)", padding: 12 }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Usluga {idx + 1}</span>
                      {offerServices.length > 1 ? (
                        <button type="button" onClick={() => setOfferServices((arr) => arr.filter((_, i) => i !== idx))} className="text-sm text-text-dim hover:text-danger">
                          Ukloni
                        </button>
                      ) : null}
                    </div>
                    <Select label="Tip" value={s.type} onChange={(e) => patchOfferService(idx, { type: e.target.value as ServiceType })} options={SERVICE_TYPE_OPTIONS} />
                    {s.type === "other" ? <Input label="Opis" value={s.label} onChange={(e) => patchOfferService(idx, { label: e.target.value })} /> : null}
                    <div className="flex gap-2">
                      {(["suggest", "own"] as const).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => patchOfferService(idx, { servicerChoice: choice })}
                          className={cn(
                            "flex-1 rounded-[14px] border px-3 py-2 text-sm transition-colors",
                            s.servicerChoice === choice ? "border-accent text-text" : "border-[color:var(--glass-line)] text-text-dim",
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
                          ...partners.filter((p) => p.isActive !== false && (p.serviceTypes ?? []).includes(s.type)).map((p) => ({ value: p.id!, label: `${p.name} (${p.address})` })),
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
                  onClick={() => setOfferServices((arr) => [...arr, { type: "service", label: "", servicerChoice: "suggest", partnerId: "", ownName: "", ownAddress: "", ownPhone: "" }])}
                  className="self-start text-sm text-accent"
                >
                  + Dodaj stavku
                </button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Predloženi termin" type="datetime-local" value={proposedTime} onChange={(e) => setProposedTime(e.target.value)} />
                  <Input label="Cena prevoza (RSD)" type="number" inputMode="numeric" value={transportPrice} onChange={(e) => setTransportPrice(e.target.value)} />
                </div>
                <Textarea label="Napomena (opciono)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button onClick={handleSendOffer} loading={busy}>Pošalji ponudu</Button>
              </div>
            </div>
          ) : null}

          {/* Ponuda (read-only) za OFFER_SENT i kasnije */}
          {offer && status !== "CREATED" ? (
            <div className="glass-soft rd-rise" style={{ padding: 20, animationDelay: ".1s" }}>
              <h2 style={{ ...sectionH, marginBottom: 12 }}>Ponuda</h2>
              <div className="rd-grad-text" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-1px" }}>
                {formatRsd(offer.transportPrice)}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-dim)", margin: "6px 0 0" }}>Termin: {formatDateTime(offer.proposedTime)}</p>
              {offer.note ? <p style={{ fontSize: 12.5, color: "var(--text-dim)", margin: "4px 0 0" }}>{offer.note}</p> : null}
              {status === "OFFER_SENT" ? <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-dim)" }}>Čeka se odgovor klijenta…</p> : null}
              {status === "REJECTED" && request.rejectionReason ? (
                <p style={{ marginTop: 12, fontSize: 13, color: "var(--warn)" }}>Razlog odbijanja: {request.rejectionReason}</p>
              ) : null}
            </div>
          ) : null}

          {/* CONFIRMED → dodela vozača */}
          {status === "CONFIRMED" ? (
            <div className="glass rd-rise" style={{ padding: 24, border: "1px solid color-mix(in srgb, var(--role-accent) 35%, transparent)" }}>
              <h2 style={cardTitle}>Dodeli vozača</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                <Select
                  label="Aktivni vozači"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  options={[{ value: "", label: "— Izaberi vozača —" }, ...activeDrivers.map((d) => ({ value: d.uid, label: `${d.fullName} · ${d.phone}` }))]}
                />
                {activeDrivers.length === 0 ? <p className="text-sm text-text-dim">Nema aktivnih vozača — dodajte ih na stranici Vozači.</p> : null}
                <Button onClick={handleAssign} loading={busy} disabled={activeDrivers.length === 0}>Dodeli vozača</Button>
              </div>
            </div>
          ) : null}

          {/* Usluge + (u toku) vođenje statusa po stavci */}
          <div className="glass-soft rd-rise" style={{ padding: 20 }}>
            <h2 style={{ ...sectionH, marginBottom: 12 }}>Usluge</h2>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, margin: 0, padding: 0, listStyle: "none" }}>
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
                  <li key={s.id} style={{ borderRadius: 12, border: "1px solid var(--glass-line)", background: "rgba(255,255,255,0.03)", padding: "10px 12px", fontSize: 14 }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">
                        {SERVICE_TYPE_LABEL[s.type]}
                        {s.type === "other" && s.label ? `: ${s.label}` : ""}
                      </div>
                      {IN_PROGRESS.includes(status) ? (
                        <select value={s.itemStatus ?? "pending"} onChange={(e) => handleItemStatus(s.id, e.target.value as ItemStatus)} className="input w-auto py-1 text-xs">
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
          </div>

          {status === "DELIVERED" ? (
            <Button onClick={handleClose} loading={busy} className="self-start">Zatvori posao</Button>
          ) : null}

          {canCancel ? (
            <button onClick={() => setShowCancel(true)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--text-dim)", fontSize: 13.5, cursor: "pointer", padding: "4px 0" }}>
              Otkaži posao
            </button>
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
