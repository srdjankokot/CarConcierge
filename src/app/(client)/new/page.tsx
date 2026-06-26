"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SERVICE_TYPE_ICON, SERVICE_TYPE_LABEL } from "@/lib/constants";
import { VEHICLE_MAKES, VEHICLE_YEARS } from "@/lib/vehicles";
import { createRequestInputSchema, todayStr } from "@/lib/validation/request";
import { createRequestCallable } from "@/lib/requests/api";
import { mapError } from "@/lib/auth/errors";
import { Icon } from "@/components/ui/Icon";
import type { ServiceType } from "@/types";

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
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(todayStr());
  const [termin, setTermin] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const modelsForMake = VEHICLE_MAKES.find((m) => m.make === make)?.models ?? [];

  function toggle(s: ServiceType) {
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  }

  async function submit() {
    if (submitting) return;
    setError("");

    const effMake = make === "Drugo" ? makeText.trim() : make;
    const effModel = make === "Drugo" || model === "Drugo" ? modelText.trim() : model;
    const t = TERMINI[termin];

    const payload = {
      vehicle: { make: effMake, model: effModel, year: Number(godiste) },
      services: picked.map((type) => ({ type, servicerChoice: "suggest" as const })),
      pickup: { address: address.trim(), timeWindow: { date, from: t.from, to: t.to } },
      dropoff: { sameAsPickup: true },
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
          {/* Vozilo: marka + godište, pa model */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div>
              <span className="rd-label">Marka</span>
              <select
                className="rd-in"
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setModel("");
                  setModelText("");
                }}
              >
                <option value="">— Izaberi marku —</option>
                {VEHICLE_MAKES.map((m) => (
                  <option key={m.make} value={m.make}>
                    {m.make}
                  </option>
                ))}
                <option value="Drugo">Drugo…</option>
              </select>
            </div>
            <div>
              <span className="rd-label">Godište</span>
              <select className="rd-in" value={godiste} onChange={(e) => setGodiste(e.target.value)}>
                <option value="">—</option>
                {VEHICLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {make === "Drugo" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <span className="rd-label">Marka (upiši)</span>
                <input className="rd-in" placeholder="npr. Cupra" value={makeText} onChange={(e) => setMakeText(e.target.value)} />
              </div>
              <div>
                <span className="rd-label">Model</span>
                <input className="rd-in" placeholder="npr. Formentor" value={modelText} onChange={(e) => setModelText(e.target.value)} />
              </div>
            </div>
          ) : make ? (
            <div>
              <span className="rd-label">Model</span>
              <select className="rd-in" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="">— Izaberi model —</option>
                {modelsForMake.map((md) => (
                  <option key={md} value={md}>
                    {md}
                  </option>
                ))}
                <option value="Drugo">Drugo…</option>
              </select>
              {model === "Drugo" ? (
                <input className="rd-in" style={{ marginTop: 10 }} placeholder="Upišite model" value={modelText} onChange={(e) => setModelText(e.target.value)} />
              ) : null}
            </div>
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
            <input className="rd-in" placeholder="Ulica i broj, Novi Sad" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <span className="rd-label">Datum</span>
              <input className="rd-in" type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <span className="rd-label">Termin</span>
              <select className="rd-in" value={termin} onChange={(e) => setTermin(Number(e.target.value))}>
                {TERMINI.map((t, i) => (
                  <option key={i} value={i}>
                    {t.from}–{t.to}
                  </option>
                ))}
              </select>
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
