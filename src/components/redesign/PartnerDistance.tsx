"use client";

import { useEffect, useState } from "react";
import { loadGoogleMaps, MAPS_KEY } from "@/lib/maps";
import type { CarRequest } from "@/types";

interface Leg {
  label: string;
  distance: string;
  duration: string;
}

// Računa vožnju (Distance Matrix) preuzimanje→partner i partner→vraćanje,
// da dispečer ima razdaljinu pri određivanju cene prevoza.
export function PartnerDistance({ request, partnerAddress }: { request: CarRequest; partnerAddress: string }) {
  const { pickup, dropoff } = request;
  const sameDrop = dropoff.sameAsPickup;
  const dropAddress = sameDrop ? pickup.address : dropoff.address;
  const dropLat = sameDrop ? pickup.lat : dropoff.lat;
  const dropLng = sameDrop ? pickup.lng : dropoff.lng;

  const [legs, setLegs] = useState<Leg[] | null>(null);
  const [totalKm, setTotalKm] = useState<string>("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!MAPS_KEY || !partnerAddress.trim()) {
      setLegs(null);
      setState("idle");
      return;
    }
    let cancelled = false;
    setState("loading");

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;
        const origin = (addr: string, lat?: number, lng?: number) =>
          typeof lat === "number" && typeof lng === "number" ? new maps.LatLng(lat, lng) : addr;

        const origins = [origin(pickup.address, pickup.lat, pickup.lng)];
        if (!sameDrop) origins.push(origin(dropAddress, dropLat, dropLng));

        const svc = new maps.DistanceMatrixService();
        svc.getDistanceMatrix(
          { origins, destinations: [partnerAddress], travelMode: maps.TravelMode.DRIVING, unitSystem: maps.UnitSystem.METRIC },
          (res: { rows: { elements: { status: string; distance: { text: string; value: number }; duration: { text: string } }[] }[] } | null, status: string) => {
            if (cancelled) return;
            const e0 = res?.rows?.[0]?.elements?.[0];
            if (status !== "OK" || !e0 || e0.status !== "OK") {
              // eslint-disable-next-line no-console
              console.warn("[PartnerDistance] status:", status, "element:", e0?.status, { origins, dest: partnerAddress });
              const elStatus = e0?.status;
              setReason(
                status === "REQUEST_DENIED"
                  ? "Distance Matrix API nije uključen na ključu (REQUEST_DENIED)."
                  : status === "OVER_QUERY_LIMIT"
                    ? "Prekoračena kvota (OVER_QUERY_LIMIT)."
                    : status !== "OK"
                      ? `Greška servisa: ${status}.`
                      : elStatus === "NOT_FOUND"
                        ? "Adresa se ne prepoznaje (preuzimanje/vraćanje ili partner) — dopuni adresu, npr. + grad."
                        : elStatus === "ZERO_RESULTS"
                          ? "Nema putne rute između tačaka."
                          : `Nedostupno (${elStatus ?? "?"}).`,
              );
              setState("error");
              setLegs(null);
              return;
            }
            const out: Leg[] = [
              { label: sameDrop ? "Preuzimanje ↔ partner" : "Preuzimanje → partner", distance: e0.distance.text, duration: e0.duration.text },
            ];
            let totalM = sameDrop ? e0.distance.value * 2 : e0.distance.value;
            if (!sameDrop) {
              const e1 = res?.rows?.[1]?.elements?.[0];
              if (e1 && e1.status === "OK") {
                out.push({ label: "Vraćanje → partner", distance: e1.distance.text, duration: e1.duration.text });
                totalM += e1.distance.value;
              }
            }
            setLegs(out);
            setTotalKm((totalM / 1000).toFixed(1));
            setState("idle");
          },
        );
      })
      .catch((e: Error) => {
        if (cancelled) return;
        const m = e?.message;
        setReason(
          m === "maps-auth-failed"
            ? "Ključ odbijen — dozvoli localhost:3001 (HTTP referrer) i uključi Maps JavaScript API."
            : m === "maps-load-failed"
              ? "Skripta mape se ne učitava (mreža ili nevažeći ključ)."
              : "Mapa se ne učitava (ključ / Maps JavaScript API).",
        );
        setState("error");
        setLegs(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerAddress, pickup.address, pickup.lat, pickup.lng, dropAddress, dropLat, dropLng, sameDrop]);

  if (!MAPS_KEY || !partnerAddress.trim()) return null;

  return (
    <div
      style={{
        marginTop: 4,
        padding: "9px 11px",
        borderRadius: 10,
        border: "1px solid color-mix(in srgb, var(--mint) 28%, transparent)",
        background: "color-mix(in srgb, var(--mint) 7%, transparent)",
        fontSize: 12.5,
      }}
    >
      {state === "loading" ? (
        <span style={{ color: "var(--text-dim)" }}>Računam razdaljinu…</span>
      ) : state === "error" || !legs ? (
        <span style={{ color: "var(--text-faint)" }}>{reason || "Razdaljina nedostupna."}</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {legs.map((l) => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "var(--text-dim)" }}>
              <span>{l.label}</span>
              <span style={{ color: "var(--text)", whiteSpace: "nowrap" }}>
                {l.distance} · ~{l.duration}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 2, fontWeight: 600 }}>
            <span style={{ color: "var(--mint)" }}>Ukupno prevoz (procena)</span>
            <span style={{ color: "var(--mint)" }}>~{totalKm} km</span>
          </div>
        </div>
      )}
    </div>
  );
}
