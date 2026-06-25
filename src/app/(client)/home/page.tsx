"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { SERVICE_TYPE_LABEL, isActiveStatus, requestIcon, toMillis } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import { IconWell } from "@/components/redesign/IconWell";
import { StatusPill } from "@/components/redesign/StatusPill";
import { Chip } from "@/components/redesign/Chip";
import { LiveTracker } from "@/components/redesign/LiveTracker";
import { RequestTile } from "@/components/redesign/RequestTile";
import { Spinner } from "@/components/ui/Spinner";
import type { CarRequest } from "@/types";

const DAYS = ["NEDELJA", "PONEDELJAK", "UTORAK", "SREDA", "ČETVRTAK", "PETAK", "SUBOTA"];
const MONTHS = [
  "JANUAR", "FEBRUAR", "MART", "APRIL", "MAJ", "JUN",
  "JUL", "AVGUST", "SEPTEMBAR", "OKTOBAR", "NOVEMBAR", "DECEMBAR",
];

const sectionH: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".6px",
  color: "var(--text-dim)",
  margin: "30px 0 14px",
};

export default function ClientHomePage() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = profile?.fullName?.split(" ")[0] ?? "";

  const now = new Date();
  const dateLabel = `${DAYS[now.getDay()]} · ${now.getDate()}. ${MONTHS[now.getMonth()]}`;

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
  const hero = active[0];
  const rest = active.slice(1);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      <div
        className="rd-rise"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 22 }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brass-soft)", letterSpacing: ".6px", marginBottom: 8 }}>
            {dateLabel}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-1px", margin: 0 }}>
            Zdravo{firstName ? `, ${firstName}` : ""} 👋
          </h1>
        </div>
        <Link href="/new" className="rd-btn">
          <Icon name="plus" size={17} /> Novi zahtev
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <Spinner size={26} className="text-accent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="glass rd-rise" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <IconWell name="car" accent />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: 0 }}>Još nemate zahteva</h2>
          <p style={{ fontSize: 14, color: "var(--text-dim)", maxWidth: 380, margin: 0 }}>
            Pošaljite prvi zahtev — vozilo, usluge i adresa preuzimanja, gotovo za minut.
          </p>
          <Link href="/new" className="rd-btn" style={{ marginTop: 4 }}>
            Napravi prvi zahtev
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
            {hero ? (
              <Link
                href={`/request/${hero.id}`}
                className="glass rd-rise rd-card-hover"
                style={{ gridColumn: "span 7", padding: 26, cursor: "pointer", animationDelay: ".06s", display: "block", color: "inherit" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <IconWell name={requestIcon(hero.services)} accent />
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600 }}>
                        {hero.vehicle.make} {hero.vehicle.model} · {hero.vehicle.year}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>
                        Preuzimanje {hero.pickup.timeWindow.date} · {hero.pickup.timeWindow.from}–{hero.pickup.timeWindow.to}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={hero.status} big />
                </div>
                <LiveTracker status={hero.status} />
                <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                  {hero.services.map((s) => (
                    <Chip key={s.id}>{SERVICE_TYPE_LABEL[s.type]}</Chip>
                  ))}
                </div>
              </Link>
            ) : null}

            <div style={{ gridColumn: hero ? "span 5" : "span 12", display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".12s", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="rd-grad-text" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-1.5px" }}>
                  {active.length}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>aktivnih zahteva u toku</div>
              </div>
              <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".18s", flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", color: "var(--mint)", background: "rgba(111,211,163,0.12)" }}>
                  <Icon name="check" size={22} />
                </span>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{history.length} završeno</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>u istoriji</div>
                </div>
              </div>
            </div>
          </div>

          {rest.length > 0 ? (
            <>
              <h2 style={sectionH}>Ostali aktivni</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {rest.map((r, i) => (
                  <Link key={r.id} href={`/request/${r.id}`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
                    <RequestTile request={r} index={i} />
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {history.length > 0 ? (
            <>
              <h2 style={sectionH}>Istorija</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {history.map((r, i) => (
                  <Link key={r.id} href={`/request/${r.id}`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
                    <RequestTile request={r} index={i} />
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
