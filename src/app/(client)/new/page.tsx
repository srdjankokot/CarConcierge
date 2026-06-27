"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { SERVICE_TYPE_ICON, SERVICE_TYPE_LABEL } from "@/lib/constants";
import { VEHICLE_MAKES, VEHICLE_YEARS } from "@/lib/vehicles";
import { createRequestInputSchema, todayStr } from "@/lib/validation/request";
import { createRequestCallable } from "@/lib/requests/api";
import { mapError } from "@/lib/auth/errors";
import { Icon } from "@/components/ui/Icon";
import { Dropdown, type DropdownOption } from "@/components/redesign/Dropdown";
import { BrandLogo } from "@/components/redesign/BrandLogo";
import { LocationPicker, type LocationValue } from "@/components/redesign/LocationPicker";
import type { ServiceType, Vehicle } from "@/types";

const SERVICE_OPTS = (Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((value) => ({
  value,
  label: SERVICE_TYPE_LABEL[value],
  icon: SERVICE_TYPE_ICON[value],
}));

const TERMINI = [
  { from: "09:00", to: "11:00" },
  { from: "13:00", to: "15:00" },
  { from: "15:00", to: "17:00" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [makeText, setMakeText] = useState("");
  const [model, setModel] = useState("");
  const [modelText, setModelText] = useState("");
  const [godiste, setGodiste] = useState("");
  const [picked, setPicked] = useState<ServiceType[]>(["tires"]);
  const [pickup, setPickup] = useState<LocationValue>({ address: "" });
  const [sameDropoff, setSameDropoff] = useState(true);
  const [dropoff, setDropoff] = useState<LocationValue>({ address: "" });
  const [date, setDate] = useState(todayStr());
  const [termin, setTermin] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const defaultedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "vehicles"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const vs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vehicle, "id">) }));
      setSavedVehicles(vs);
      if (!defaultedRef.current && vs.length > 0) {
        defaultedRef.current = true;
        setSelectedVehicleId(vs[0].id ?? null);
      }
    });
    return () => unsub();
  }, [user]);

  const vehCard = (on: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 13px",
    borderRadius: 14,
    cursor: "pointer",
    border: `1px solid ${on ? "var(--brass)" : "var(--glass-line)"}`,
    background: on ? "color-mix(in srgb, var(--brass) 12%, transparent)" : "rgba(255,255,255,0.03)",
    transition: "all .18s cubic-bezier(.2,1,.3,1)",
  });

  const modelsForMake = VEHICLE_MAKES.find((m) => m.make === make)?.models ?? [];

  const makeOptions: DropdownOption[] = [
    ...VEHICLE_MAKES.map((m) => ({ value: m.make, label: m.make, icon: <BrandLogo make={m.make} size={24} /> })),
    { value: "Drugo", label: "Drugo…", icon: <BrandLogo make="Drugo" size={24} /> },
  ];
  const modelOptions: DropdownOption[] = [
    ...modelsForMake.map((md) => ({ value: md, label: md })),
    { value: "Drugo", label: "Drugo…" },
  ];
  const yearOptions: DropdownOption[] = VEHICLE_YEARS.map((y) => ({ value: String(y), label: String(y) }));
  const terminOptions: DropdownOption[] = TERMINI.map((t, i) => ({ value: String(i), label: `${t.from}–${t.to}` }));

  function toggle(s: ServiceType) {
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  }

  async function submit() {
    if (submitting) return;
    setError("");

    const t = TERMINI[termin];

    let vehiclePayload: { vehicleId?: string; make: string; model: string; year: number; plate?: string };
    const sel = selectedVehicleId ? savedVehicles.find((v) => v.id === selectedVehicleId) : null;
    if (sel) {
      vehiclePayload = { vehicleId: sel.id, make: sel.make, model: sel.model, year: sel.year };
      if (sel.plate) vehiclePayload.plate = sel.plate;
    } else {
      const effMake = make === "Drugo" ? makeText.trim() : make;
      const effModel = make === "Drugo" || model === "Drugo" ? modelText.trim() : model;
      vehiclePayload = { make: effMake, model: effModel, year: Number(godiste) };
    }

    const pickupPayload: { address: string; lat?: number; lng?: number; timeWindow: { date: string; from: string; to: string } } = {
      address: pickup.address.trim(),
      timeWindow: { date, from: t.from, to: t.to },
    };
    if (typeof pickup.lat === "number") pickupPayload.lat = pickup.lat;
    if (typeof pickup.lng === "number") pickupPayload.lng = pickup.lng;

    let dropoffPayload: { sameAsPickup: boolean; address?: string; lat?: number; lng?: number };
    if (sameDropoff) {
      dropoffPayload = { sameAsPickup: true };
    } else {
      dropoffPayload = { sameAsPickup: false, address: dropoff.address.trim() };
      if (typeof dropoff.lat === "number") dropoffPayload.lat = dropoff.lat;
      if (typeof dropoff.lng === "number") dropoffPayload.lng = dropoff.lng;
    }

    const payload = {
      vehicle: vehiclePayload,
      services: picked.map((type) => ({ type, servicerChoice: "suggest" as const })),
      pickup: pickupPayload,
      dropoff: dropoffPayload,
    };

    const parsed = createRequestInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Proverite unete podatke.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createRequestCallable(parsed.data);
      router.replace(`/request/${res.data.requestId}`);
    } catch (e) {
      setError(mapError(e));
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Link href="/home" className="rd-rise" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-dim)", fontSize: 14, marginBottom: 18 }}>
        <Icon name="arrowLeft" size={16} /> Nazad
      </Link>

      <div className="rd-rise" style={{ animationDelay: ".04s", marginBottom: 22 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-.8px", margin: "0 0 4px" }}>
          Novi zahtev
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-dim)", margin: 0 }}>
          Vozilo, usluge i adresa preuzimanja — gotovo za minut.
        </p>
      </div>

      <div className="glass rd-rise" style={{ padding: 26, animationDelay: ".1s" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Sačuvana vozila (ako ih klijent ima) */}
          {savedVehicles.length > 0 ? (
            <div>
              <span className="rd-label">Vozilo</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {savedVehicles.map((v) => {
                  const on = selectedVehicleId === v.id;
                  return (
                    <button key={v.id} type="button" onClick={() => setSelectedVehicleId(v.id ?? null)} style={vehCard(on)}>
                      <BrandLogo make={v.make} size={30} />
                      <div style={{ textAlign: "left", lineHeight: 1.3 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: on ? "var(--text)" : "var(--text-dim)" }}>
                          {v.make} {v.model}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)" }}>
                          {v.year}
                          {v.plate ? ` · ${v.plate}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button type="button" onClick={() => setSelectedVehicleId(null)} style={{ ...vehCard(selectedVehicleId === null), borderStyle: "dashed", color: "var(--text-dim)" }}>
                  <Icon name="plus" size={17} />
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>Drugo vozilo</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Ručni unos vozila — novo / „Drugo vozilo" */}
          {selectedVehicleId === null ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.1fr_1.1fr_0.8fr]">
                <div>
                  <span className="rd-label">Marka</span>
                  <Dropdown
                    value={make}
                    onChange={(v) => {
                      setMake(v);
                      setModel("");
                      setModelText("");
                    }}
                    options={makeOptions}
                    placeholder="— Marka —"
                    searchable
                  />
                </div>
                <div>
                  <span className="rd-label">Model</span>
                  <Dropdown value={model} onChange={setModel} options={modelOptions} placeholder="— Model —" disabled={!make || make === "Drugo"} />
                </div>
                <div>
                  <span className="rd-label">Godište</span>
                  <Dropdown value={godiste} onChange={setGodiste} options={yearOptions} placeholder="—" />
                </div>
              </div>

              {make === "Drugo" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="rd-label">Marka (upiši)</span>
                    <input className="rd-in" placeholder="npr. Cupra" value={makeText} onChange={(e) => setMakeText(e.target.value)} />
                  </div>
                  <div>
                    <span className="rd-label">Model (upiši)</span>
                    <input className="rd-in" placeholder="npr. Formentor" value={modelText} onChange={(e) => setModelText(e.target.value)} />
                  </div>
                </div>
              ) : model === "Drugo" ? (
                <div>
                  <span className="rd-label">Model (upiši)</span>
                  <input className="rd-in" placeholder="Upišite model" value={modelText} onChange={(e) => setModelText(e.target.value)} />
                </div>
              ) : null}
            </>
          ) : null}

          <div>
            <span className="rd-label">Usluge</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {SERVICE_OPTS.map((s) => {
                const on = picked.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggle(s.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "12px 13px",
                      borderRadius: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      border: `1px solid ${on ? "var(--brass)" : "var(--glass-line)"}`,
                      background: on ? "color-mix(in srgb, var(--brass) 13%, transparent)" : "rgba(255,255,255,0.03)",
                      color: on ? "var(--brass-soft)" : "var(--text-dim)",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all .18s cubic-bezier(.2,1,.3,1)",
                      transform: on ? "translateY(-1px)" : "none",
                      boxShadow: on ? "0 8px 18px -10px rgba(201,168,106,0.5)" : "none",
                    }}
                  >
                    <Icon name={s.icon} size={17} /> {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="rd-label">Adresa preuzimanja</span>
            <LocationPicker value={pickup} onChange={setPickup} placeholder="Pretražite adresu preuzimanja…" />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, color: "var(--text-dim)" }}>
              <input
                type="checkbox"
                checked={sameDropoff}
                onChange={(e) => setSameDropoff(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--brass)" }}
              />
              Vraćanje na istu adresu
            </label>
            {!sameDropoff ? (
              <div style={{ marginTop: 12 }}>
                <span className="rd-label">Adresa vraćanja</span>
                <LocationPicker value={dropoff} onChange={setDropoff} placeholder="Pretražite adresu vraćanja…" />
              </div>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <span className="rd-label">Datum</span>
              <input className="rd-in" type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <span className="rd-label">Termin</span>
              <Dropdown value={String(termin)} onChange={(v) => setTermin(Number(v))} options={terminOptions} />
            </div>
          </div>

          {error ? <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p> : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
            <Link href="/home" className="rd-btn-ghost">
              Odustani
            </Link>
            <button type="button" className="rd-btn rd-shimmer" disabled={submitting} onClick={submit}>
              {submitting ? "Slanje…" : "Pošalji zahtev"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
