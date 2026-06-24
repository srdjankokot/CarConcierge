import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ServiceChips } from "@/components/ui/ServiceChips";
import type { CarRequest } from "@/types";

export function RequestCard({ request, href }: { request: CarRequest; href: string }) {
  const { date, from, to } = request.pickup.timeWindow;
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-accent">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium">
              {request.vehicle.make} {request.vehicle.model} · {request.vehicle.year}
            </div>
            <div className="mt-0.5 font-mono text-xs text-text-faint">
              Preuzimanje: {date} · {from}–{to}
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>
        <div className="mt-3">
          <ServiceChips services={request.services} />
        </div>
      </Card>
    </Link>
  );
}
