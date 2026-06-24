"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { DRIVER_ACTION, type DriverNextStatus } from "@/lib/driver/flow";
import { advanceJobStatusCallable } from "@/lib/driver/api";
import { mapError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { CarRequest } from "@/types";

export default function DriverJobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const firstName = profile?.fullName?.split(" ")[0] ?? "";

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "requests"), where("assignedDriverId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarRequest, "id">) }));
        rows.sort((a, b) =>
          `${a.pickup.timeWindow.date} ${a.pickup.timeWindow.from}`.localeCompare(
            `${b.pickup.timeWindow.date} ${b.pickup.timeWindow.from}`,
          ),
        );
        setJobs(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user]);

  async function advance(jobId: string, to: DriverNextStatus) {
    setBusyId(jobId);
    setError("");
    try {
      await advanceJobStatusCallable({ requestId: jobId, toStatus: to });
    } catch (e) {
      setError(mapError(e));
    } finally {
      setBusyId(null);
    }
  }

  const active = jobs.filter((j) => j.status !== "CLOSED" && j.status !== "CANCELLED");
  const done = jobs.filter((j) => j.status === "CLOSED");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Zdravo{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mt-1 text-sm text-text-dim">Vaši dodeljeni poslovi.</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={26} className="text-accent" />
        </div>
      ) : active.length === 0 && done.length === 0 ? (
        <EmptyState icon={<ClipboardIcon className="h-7 w-7 text-accent" />} title="Trenutno nemaš dodeljenih poslova" />
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">
              Aktivni ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-sm text-text-faint">
                Nema aktivnih poslova.
              </p>
            ) : (
              active.map((j) => (
                <JobCard key={j.id} job={j} busy={busyId === j.id} onAdvance={advance} />
              ))
            )}
          </section>

          {done.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">
                Završeni ({done.length})
              </h2>
              {done.map((j) => (
                <JobCard key={j.id} job={j} busy={false} onAdvance={advance} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  busy,
  onAdvance,
}: {
  job: CarRequest;
  busy: boolean;
  onAdvance: (jobId: string, to: DriverNextStatus) => void;
}) {
  const isNew = job.status === "DRIVER_ASSIGNED";
  const action = DRIVER_ACTION[job.status];

  return (
    <Card className={cn(isNew && "border-l-4 border-l-accent")}>
      <div className="flex items-start gap-3">
        <StatusBadge status={job.status} />
        {isNew ? <span className="badge text-accent">Novi posao</span> : null}
      </div>

      <Link href={`/jobs/${job.id}`} className="mt-2 block">
        <div className="font-medium">
          {job.vehicle.make} {job.vehicle.model} · {job.vehicle.year}
        </div>
        <div className="mt-0.5 text-sm text-text-dim">{job.pickup.address}</div>
        <div className="mt-1 font-mono text-xs text-text-faint">
          {job.pickup.timeWindow.date} · {job.pickup.timeWindow.from}–{job.pickup.timeWindow.to} ·{" "}
          {job.services.length} {job.services.length === 1 ? "destinacija" : "destinacije"}
        </div>
      </Link>

      {action ? (
        <div className="mt-3">
          {action.phase ? (
            // Korak traži fotografiju → otvori detalj.
            <Link href={`/jobs/${job.id}`}>
              <Button variant="ghost" fullWidth>
                {action.label} (foto) →
              </Button>
            </Link>
          ) : (
            <Button fullWidth loading={busy} onClick={() => onAdvance(job.id!, action.to)}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}
