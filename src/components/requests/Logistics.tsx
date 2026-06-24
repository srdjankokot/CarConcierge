import { formatDate } from "@/lib/constants";
import type { CarRequest } from "@/types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-dim">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

// Mesto i vreme razdvojeni u zasebna, označena polja (klijent/dispečer/vozač isto).
export function Logistics({ request }: { request: CarRequest }) {
  const { pickup, dropoff } = request;
  const tw = pickup.timeWindow;
  const dropoffAddress = dropoff.sameAsPickup ? pickup.address : dropoff.address;
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Mesto preuzimanja" value={pickup.address} />
      <Field label="Vreme preuzimanja" value={`${formatDate(tw.date)}, ${tw.from}–${tw.to}`} />
      <Field label="Mesto vraćanja" value={dropoffAddress} />
    </div>
  );
}
