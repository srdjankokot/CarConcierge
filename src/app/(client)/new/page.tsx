"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { SERVICE_TYPE_LABEL, SERVICE_TYPE_OPTIONS } from "@/lib/constants";
import { createRequestInputSchema, todayStr } from "@/lib/validation/request";
import { createRequestCallable } from "@/lib/requests/api";
import { mapError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CreateRequestInput } from "@/lib/validation/request";
import type { ServiceType, Servicer, Vehicle } from "@/types";

type VehicleForm = {
  vehicleId: string;
  make: string;
  model: string;
  year: string;
  plate: string;
  save: boolean;
};
type ServiceForm = {
  localId: string;
  type: ServiceType;
  label: string;
  servicerChoice: "suggest" | "own";
  ownServicerId: string;
  ownName: string;
  ownAddress: string;
  ownPhone: string;
  saveServicer: boolean;
};
type PickupForm = { address: string; date: string; from: string; to: string };
type DropoffForm = { sameAsPickup: boolean; address: string };

const STEPS = ["Vozilo", "Usluge", "Preuzimanje", "Vraćanje", "Pregled"];

function emptyService(): ServiceForm {
  return {
    localId: crypto.randomUUID(),
    type: "service",
    label: "",
    servicerChoice: "suggest",
    ownServicerId: "",
    ownName: "",
    ownAddress: "",
    ownPhone: "",
    saveServicer: false,
  };
}

export default function NewRequestPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [servicers, setServicers] = useState<Servicer[]>([]);

  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState<VehicleForm>({
    vehicleId: "",
    make: "",
    model: "",
    year: "",
    plate: "",
    save: true,
  });
  const [services, setServices] = useState<ServiceForm[]>([emptyService()]);
  const [pickup, setPickup] = useState<PickupForm>({
    address: "",
    date: todayStr(),
    from: "09:00",
    to: "17:00",
  });
  const [dropoff, setDropoff] = useState<DropoffForm>({ sameAsPickup: true, address: "" });

  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubV = onSnapshot(
      query(collection(db, "users", user.uid, "vehicles"), orderBy("createdAt", "desc")),
      (snap) => setVehicles(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vehicle, "id">) }))),
    );
    const unsubS = onSnapshot(
      query(collection(db, "users", user.uid, "servicers"), orderBy("createdAt", "desc")),
      (snap) => setServicers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Servicer, "id">) }))),
    );
    return () => {
      unsubV();
      unsubS();
    };
  }, [user]);

  const vehicleOptions = useMemo(
    () => [
      { value: "", label: "— Novo vozilo —" },
      ...vehicles.map((v) => ({ value: v.id!, label: `${v.make} ${v.model} · ${v.year}` })),
    ],
    [vehicles],
  );

  function pickSavedVehicle(id: string) {
    if (!id) {
      setVehicle((v) => ({ ...v, vehicleId: "", make: "", model: "", year: "", plate: "" }));
      return;
    }
    const v = vehicles.find((x) => x.id === id);
    if (v) {
      setVehicle({
        vehicleId: v.id!,
        make: v.make,
        model: v.model,
        year: String(v.year),
        plate: v.plate ?? "",
        save: false,
      });
    }
  }

  function updateService(localId: string, patch: Partial<ServiceForm>) {
    setServices((prev) => prev.map((s) => (s.localId === localId ? { ...s, ...patch } : s)));
  }

  function pickSavedServicer(localId: string, servicerId: string) {
    if (!servicerId) {
      updateService(localId, { ownServicerId: "", ownName: "", ownAddress: "", ownPhone: "" });
      return;
    }
    const s = servicers.find((x) => x.id === servicerId);
    if (s) {
      updateService(localId, {
        ownServicerId: s.id!,
        ownName: s.name,
        ownAddress: s.address,
        ownPhone: s.phone ?? "",
        saveServicer: false,
      });
    }
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!vehicle.make.trim() || !vehicle.model.trim()) return "Unesite marku i model.";
      const y = Number(vehicle.year);
      if (!Number.isInteger(y) || y < 1950 || y > new Date().getFullYear() + 1)
        return "Unesite ispravno godište.";
    }
    if (current === 1) {
      if (services.length === 0) return "Dodajte bar jednu uslugu.";
      for (const s of services) {
        if (s.servicerChoice === "own" && (!s.ownName.trim() || !s.ownAddress.trim()))
          return "Za 'moj serviser' unesite naziv i adresu.";
      }
    }
    if (current === 2) {
      if (pickup.address.trim().length < 5) return "Adresa preuzimanja mora imati bar 5 karaktera.";
      if (pickup.date < todayStr()) return "Datum ne može biti u prošlosti.";
      if (!(pickup.from < pickup.to)) return "'Od' mora biti pre 'do'.";
    }
    if (current === 3) {
      if (!dropoff.sameAsPickup && dropoff.address.trim().length < 5)
        return "Unesite adresu vraćanja (min 5 karaktera).";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStepError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function buildPayload(): CreateRequestInput {
    return {
      vehicle: {
        vehicleId: vehicle.vehicleId || undefined,
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: Number(vehicle.year),
        plate: vehicle.plate.trim() || undefined,
      },
      services: services.map((s) => ({
        type: s.type,
        label: s.type === "other" ? s.label.trim() || undefined : undefined,
        servicerChoice: s.servicerChoice,
        ownServicer:
          s.servicerChoice === "own"
            ? {
                servicerId: s.ownServicerId || undefined,
                name: s.ownName.trim(),
                address: s.ownAddress.trim(),
                phone: s.ownPhone.trim() || undefined,
              }
            : undefined,
      })),
      pickup: {
        address: pickup.address.trim(),
        timeWindow: { date: pickup.date, from: pickup.from, to: pickup.to },
      },
      dropoff: {
        sameAsPickup: dropoff.sameAsPickup,
        address: dropoff.sameAsPickup ? undefined : dropoff.address.trim(),
      },
    };
  }

  async function persistSavedEntities() {
    if (!user) return;
    // Sačuvaj novo vozilo u profil (ako je traženo).
    if (vehicle.save && !vehicle.vehicleId) {
      await addDoc(collection(db, "users", user.uid, "vehicles"), {
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: Number(vehicle.year),
        plate: vehicle.plate.trim() || null,
        note: null,
        createdAt: serverTimestamp(),
      });
    }
    // Sačuvaj nove servisere iz 'moj serviser' stavki.
    for (const s of services) {
      if (s.servicerChoice === "own" && s.saveServicer && !s.ownServicerId) {
        await addDoc(collection(db, "users", user.uid, "servicers"), {
          name: s.ownName.trim(),
          address: s.ownAddress.trim(),
          phone: s.ownPhone.trim() || null,
          createdAt: serverTimestamp(),
        });
      }
    }
  }

  async function submit() {
    if (submitting) return;
    setStepError("");
    const payload = buildPayload();
    const parsed = createRequestInputSchema.safeParse(payload);
    if (!parsed.success) {
      setStepError(parsed.error.issues[0]?.message ?? "Proverite unete podatke.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createRequestCallable(parsed.data);
      // Tek nakon uspešnog kreiranja zahteva snimi vozilo/servisere u profil
      // (best-effort: neuspeh ovde ne sme da blokira već kreiran zahtev).
      try {
        await persistSavedEntities();
      } catch {
        /* ignore */
      }
      router.replace(`/request/${res.data.requestId}`);
    } catch (e) {
      setStepError(mapError(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Novi zahtev</h1>
        <p className="mt-1 text-sm text-text-dim">Korak {step + 1} od {STEPS.length} · {STEPS[step]}</p>
      </div>

      {/* progress */}
      <div className="flex gap-1.5">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-border")}
          />
        ))}
      </div>

      <Card className="flex flex-col gap-5">
        {step === 0 ? (
          <>
            <h2 className="text-lg font-semibold">Vozilo</h2>
            {vehicles.length > 0 ? (
              <Select
                label="Sačuvano vozilo"
                value={vehicle.vehicleId}
                onChange={(e) => pickSavedVehicle(e.target.value)}
                options={vehicleOptions}
              />
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Marka" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value, vehicleId: "" })} />
              <Input label="Model" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value, vehicleId: "" })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Godište" type="number" inputMode="numeric" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value, vehicleId: "" })} />
              <Input label="Registracija (opciono)" value={vehicle.plate} onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })} />
            </div>
            {!vehicle.vehicleId ? (
              <label className="flex items-center gap-2 text-sm text-text-dim">
                <input type="checkbox" checked={vehicle.save} onChange={(e) => setVehicle({ ...vehicle, save: e.target.checked })} />
                Sačuvaj vozilo u profil
              </label>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Usluge</h2>
              <Button variant="ghost" type="button" onClick={() => setServices((s) => [...s, emptyService()])}>
                + Dodaj uslugu
              </Button>
            </div>
            {services.map((s, idx) => (
              <div key={s.localId} className="flex flex-col gap-3 rounded-lg border border-border-soft bg-bg-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usluga {idx + 1}</span>
                  {services.length > 1 ? (
                    <button type="button" onClick={() => setServices((arr) => arr.filter((x) => x.localId !== s.localId))} className="text-sm text-text-dim hover:text-danger">
                      Ukloni
                    </button>
                  ) : null}
                </div>
                <Select
                  label="Tip usluge"
                  value={s.type}
                  onChange={(e) => updateService(s.localId, { type: e.target.value as ServiceType })}
                  options={SERVICE_TYPE_OPTIONS}
                />
                {s.type === "other" ? (
                  <Input label="Opis usluge" value={s.label} onChange={(e) => updateService(s.localId, { label: e.target.value })} />
                ) : null}

                <div className="flex gap-2">
                  {(["suggest", "own"] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => updateService(s.localId, { servicerChoice: choice })}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                        s.servicerChoice === choice
                          ? "border-accent text-text"
                          : "border-border-soft text-text-dim hover:text-text",
                      )}
                    >
                      {choice === "suggest" ? "Predložite vi" : "Moj serviser"}
                    </button>
                  ))}
                </div>

                {s.servicerChoice === "own" ? (
                  <div className="flex flex-col gap-3">
                    {servicers.length > 0 ? (
                      <Select
                        label="Sačuvani serviser"
                        value={s.ownServicerId}
                        onChange={(e) => pickSavedServicer(s.localId, e.target.value)}
                        options={[
                          { value: "", label: "— Novi serviser —" },
                          ...servicers.map((x) => ({ value: x.id!, label: x.name })),
                        ]}
                      />
                    ) : null}
                    <Input label="Naziv servisera" value={s.ownName} onChange={(e) => updateService(s.localId, { ownName: e.target.value, ownServicerId: "" })} />
                    <Input label="Adresa servisera" value={s.ownAddress} onChange={(e) => updateService(s.localId, { ownAddress: e.target.value, ownServicerId: "" })} />
                    <Input label="Telefon (opciono)" type="tel" value={s.ownPhone} onChange={(e) => updateService(s.localId, { ownPhone: e.target.value })} />
                    {!s.ownServicerId ? (
                      <label className="flex items-center gap-2 text-sm text-text-dim">
                        <input type="checkbox" checked={s.saveServicer} onChange={(e) => updateService(s.localId, { saveServicer: e.target.checked })} />
                        Sačuvaj servisera za ubuduće
                      </label>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-text-faint">Dispečer će izabrati partnera iz mreže i predložiti ga u ponudi.</p>
                )}
              </div>
            ))}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-lg font-semibold">Preuzimanje</h2>
            <Input label="Adresa preuzimanja" placeholder="Ulica i broj, Novi Sad" value={pickup.address} onChange={(e) => setPickup({ ...pickup, address: e.target.value })} />
            <Input label="Datum" type="date" min={todayStr()} value={pickup.date} onChange={(e) => setPickup({ ...pickup, date: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Od" type="time" value={pickup.from} onChange={(e) => setPickup({ ...pickup, from: e.target.value })} />
              <Input label="Do" type="time" value={pickup.to} onChange={(e) => setPickup({ ...pickup, to: e.target.value })} />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="text-lg font-semibold">Vraćanje</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={dropoff.sameAsPickup} onChange={(e) => setDropoff({ ...dropoff, sameAsPickup: e.target.checked })} />
              Isto kao adresa preuzimanja
            </label>
            {!dropoff.sameAsPickup ? (
              <Input label="Adresa vraćanja" value={dropoff.address} onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })} />
            ) : (
              <p className="text-sm text-text-dim">{pickup.address || "Adresa preuzimanja"}</p>
            )}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2 className="text-lg font-semibold">Pregled</h2>
            <ReviewRow label="Vozilo" value={`${vehicle.make} ${vehicle.model} · ${vehicle.year}${vehicle.plate ? ` · ${vehicle.plate}` : ""}`} />
            <div>
              <div className="label">Usluge</div>
              <ul className="flex flex-col gap-2">
                {services.map((s) => (
                  <li key={s.localId} className="rounded-lg border border-border-soft bg-bg-2 px-3 py-2 text-sm">
                    <span className="font-medium">
                      {SERVICE_TYPE_LABEL[s.type]}
                      {s.type === "other" && s.label ? `: ${s.label}` : ""}
                    </span>
                    <span className="text-text-dim">
                      {" — "}
                      {s.servicerChoice === "own" ? `${s.ownName}, ${s.ownAddress}` : "predlog dispečera"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <ReviewRow label="Preuzimanje" value={`${pickup.address} · ${pickup.date} ${pickup.from}–${pickup.to}`} />
            <ReviewRow label="Vraćanje" value={dropoff.sameAsPickup ? pickup.address : dropoff.address} />
          </>
        ) : null}

        {stepError ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{stepError}</p>
        ) : null}

        <div className="mt-1 flex justify-between gap-2">
          <Button variant="ghost" type="button" onClick={back} disabled={step === 0 || submitting}>
            Nazad
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Dalje
            </Button>
          ) : (
            <Button type="button" onClick={submit} loading={submitting}>
              Pošalji zahtev
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
