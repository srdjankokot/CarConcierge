"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { isActiveStatus, toMillis } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { RequestCard } from "@/components/requests/RequestCard";
import { CarIcon } from "@/components/ui/icons";
import type { CarRequest } from "@/types";

export default function ClientHomePage() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = profile?.fullName?.split(" ")[0] ?? "";

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "requests"), where("clientId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarRequest, "id">) }));
        rows.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setRequests(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user]);

  const active = requests.filter((r) => isActiveStatus(r.status));
  const history = requests.filter((r) => !isActiveStatus(r.status));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Zdravo{firstName ? `, ${firstName}` : ""}</h1>
          <p className="mt-1 text-sm text-text-dim">Vaši zahtevi i poslovi na jednom mestu.</p>
        </div>
        <Link href="/new">
          <Button>+ Novi zahtev</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={26} className="text-accent" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<CarIcon className="h-7 w-7 text-accent" />}
          title="Još nemate zahteva"
          description="Pošaljite prvi zahtev — vozilo, usluge, adresa preuzimanja i vraćanja."
          action={
            <Link href="/new">
              <Button>Napravi prvi zahtev</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">
              Aktivni ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-sm text-text-faint">
                Nema aktivnih zahteva.
              </p>
            ) : (
              active.map((r) => <RequestCard key={r.id} request={r} href={`/request/${r.id}`} />)
            )}
          </section>

          {history.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">
                Istorija ({history.length})
              </h2>
              {history.map((r) => (
                <RequestCard key={r.id} request={r} href={`/request/${r.id}`} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
