import { formatDate } from "@/lib/constants";
import type { CarRequest } from "@/types";

function mapsHref(lat: number | undefined, lng: number | undefined, address: string): string {
  const q = typeof lat === "number" && typeof lng === "number" ? `${lat},${lng}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <div className="text-xs text-text-dim">{label}</div>
      <div className="text-sm">
        {value}
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "var(--role-accent)", fontSize: 12, whiteSpace: "nowrap" }}>
            Mapa ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

// Mesto i vreme razdvojeni u zasebna, označena polja (klijent/dispečer/vozač isto).
export function Logistics({ request }: { request: CarRequest }) {
  const { pickup, dropoff } = request;
  const tw = pickup.timeWindow;
  const sameDrop = dropoff.sameAsPickup;
  const dropAddress = sameDrop ? pickup.address : dropoff.address;
  const dropLat = sameDrop ? pickup.lat : dropoff.lat;
  const dropLng = sameDrop ? pickup.lng : dropoff.lng;
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Mesto preuzimanja" value={pickup.address} href={mapsHref(pickup.lat, pickup.lng, pickup.address)} />
      <Field label="Vreme preuzimanja" value={`${formatDate(tw.date)}, ${tw.from}–${tw.to}`} />
      <Field label="Mesto vraćanja" value={dropAddress} href={mapsHref(dropLat, dropLng, dropAddress)} />
    </div>
  );
}
