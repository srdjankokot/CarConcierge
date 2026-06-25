// Auto Concierge — APP REDESIGN (bold / glass / bento / rich motion).
// Standalone preview; does NOT replace the original ui_kits/app.
const DS = window.AutoConciergeDesignSystem_d4d678;
const { BrandMark, Icon } = DS;
const { useState, useEffect } = React;

const ROLE_ACCENT = { client: "#c9a86a", dispatcher: "#6fd3a3" };

const SEED = [
  { id: "r1", make: "Audi A4", year: 2021, date: "14.03", from: "09:00", to: "11:00", status: "AT_SERVICE", services: ["Gume", "Pranje / detailing"], client: "Marko Jovanović", icon: "tire", price: "2.400" },
  { id: "r2", make: "Golf 7", year: 2019, date: "12.03", from: "08:00", to: "10:00", status: "DELIVERED", services: ["Tehnički pregled"], client: "Ivana Petrović", icon: "clipboard", price: "1.800" },
  { id: "r3", make: "BMW X3", year: 2022, date: "09.03", from: "10:30", to: "12:30", status: "CLOSED", services: ["Detailing"], client: "Nikola Savić", icon: "wash", price: "5.200" },
  { id: "r4", make: "Škoda Octavia", year: 2018, date: "15.03", from: "07:30", to: "09:30", status: "CREATED", services: ["Servis"], client: "Ana Marić", icon: "wrench", price: "—" },
];

const STEP_DEFS = [
  { key: "CREATED", label: "Zahtev poslat" },
  { key: "OFFER_SENT", label: "Ponuda poslata" },
  { key: "CONFIRMED", label: "Potvrđeno" },
  { key: "DRIVER_ASSIGNED", label: "Vozač dodeljen" },
  { key: "PICKED_UP", label: "Vozilo preuzeto" },
  { key: "AT_SERVICE", label: "Na usluzi" },
  { key: "SERVICE_DONE", label: "Usluga gotova" },
  { key: "RETURNING", label: "Vraćanje" },
  { key: "DELIVERED", label: "Isporučeno" },
  { key: "CLOSED", label: "Zatvoreno" },
];
const STATUS_LABEL = Object.fromEntries(STEP_DEFS.map((s) => [s.key, s.label]));
STATUS_LABEL.REJECTED = "Odbijeno"; STATUS_LABEL.CANCELLED = "Otkazano";
const TERMINAL = ["CLOSED", "REJECTED", "CANCELLED"];

// ── Small pieces ─────────────────────────────────────────────
function StatusPill({ status, big }) {
  const done = ["DELIVERED", "CLOSED"].includes(status);
  const warn = ["REJECTED", "CANCELLED"].includes(status);
  const color = done ? "var(--mint)" : warn ? "var(--warn)" : "var(--role-accent)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-mono)", fontSize: big ? 12 : 11, padding: big ? "6px 12px" : "5px 10px", borderRadius: 999, color, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 8px currentColor" }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function Chip({ children }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "5px 11px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-line)", color: "var(--text-dim)" }}>{children}</span>;
}

function IconWell({ name, accent }) {
  return (
    <span style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", color: accent ? "#1a130a" : "var(--brass)", background: accent ? "var(--brass-grad)" : "rgba(201,168,106,0.12)", border: accent ? "none" : "1px solid var(--glass-line)", boxShadow: accent ? "0 8px 20px -8px rgba(201,168,106,0.6)" : "none", flexShrink: 0 }}>
      <Icon name={name} size={22} />
    </span>
  );
}

// ── Animated status stepper (vertical, sequential reveal) ────
function AnimatedStepper({ status }) {
  const [shown, setShown] = useState(0);
  const current = STEP_DEFS.findIndex((s) => s.key === status);
  const target = current < 0 ? 0 : current;
  useEffect(() => {
    setShown(0);
    let i = 0;
    const t = setInterval(() => { i += 1; setShown(i); if (i >= target) clearInterval(t); }, 160);
    return () => clearInterval(t);
  }, [status]);

  if (["REJECTED", "CANCELLED"].includes(status)) {
    return <div className="glass-soft" style={{ padding: "16px 18px", color: "var(--warn)", border: "1px solid color-mix(in srgb, var(--warn) 40%, transparent)", background: "color-mix(in srgb, var(--warn) 10%, transparent)" }}>{STATUS_LABEL[status]}</div>;
  }
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
      {STEP_DEFS.map((s, i) => {
        const state = i < shown ? "done" : i === shown && shown <= target ? "active" : i <= target ? "done" : "pending";
        const isDone = state === "done";
        const isActive = i === target;
        const last = i === STEP_DEFS.length - 1;
        const reached = i <= shown;
        return (
          <li key={s.key} style={{ display: "flex", gap: 14, minHeight: 44 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ position: "relative", width: 16, height: 16, marginTop: 2, borderRadius: "50%", display: "grid", placeItems: "center",
                background: isActive ? "var(--brass-grad)" : isDone ? "var(--mint)" : "rgba(255,255,255,0.04)",
                border: isActive || isDone ? "none" : "2px solid var(--border)",
                boxShadow: isActive ? "0 0 0 5px rgba(201,168,106,0.18)" : isDone ? "0 0 12px rgba(111,211,163,0.5)" : "none",
                transform: reached ? "scale(1)" : "scale(0)", transition: "transform .4s cubic-bezier(.2,1.4,.4,1)" }}>
                {isActive ? <span className="rd-pulse" style={{ position: "absolute", inset: 0, borderRadius: "50%" }} /> : null}
                {isDone && !isActive ? <Icon name="check" size={9} style={{ color: "#0a110d", strokeWidth: 2.6 }} /> : null}
              </span>
              {!last ? (
                <span style={{ width: 2, flex: 1, minHeight: 22, background: "var(--border)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                  <span style={{ position: "absolute", top: 0, left: 0, right: 0, background: "var(--mint-grad)", height: i < shown ? "100%" : "0%", transition: "height .35s ease" }} />
                </span>
              ) : null}
            </div>
            <span style={{ paddingBottom: 14, fontSize: 14, fontWeight: isActive ? 600 : 400, color: reached ? (isActive ? "var(--text)" : "var(--text)") : "var(--text-faint)", opacity: reached ? 1 : 0.5, transition: "opacity .3s, color .3s" }}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ── Compact animated live tracker (hero card) ────────────────
function LiveTracker({ status }) {
  const order = ["PICKED_UP", "AT_SERVICE", "RETURNING", "DELIVERED"];
  const labels = { PICKED_UP: "Preuzeto", AT_SERVICE: "Na usluzi", RETURNING: "Vraćanje", DELIVERED: "Vraćeno" };
  const cur = Math.max(0, order.indexOf(status));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 18 }}>
      {order.map((k, i) => {
        const done = i < cur, active = i === cur;
        return (
          <React.Fragment key={k}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span className={active ? "rd-pulse" : ""} style={{ position: "relative", width: 14, height: 14, borderRadius: "50%", background: active ? "var(--brass-grad)" : done ? "var(--mint)" : "rgba(255,255,255,0.08)", boxShadow: done ? "0 0 10px rgba(111,211,163,0.5)" : "none" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: active ? "var(--brass-soft)" : done ? "var(--mint)" : "var(--text-faint)", whiteSpace: "nowrap" }}>{labels[k]}</span>
            </div>
            {i < order.length - 1 ? (
              <span style={{ flex: 1, height: 2, margin: "0 6px", marginBottom: 18, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: i < cur ? "100%" : "0%", background: "var(--mint-grad)", transition: "width .6s ease", transitionDelay: `${i * 0.15}s` }} />
              </span>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────
function Header({ role, setRole, tabs, active, onNav, onSignOut }) {
  return (
    <header className="glass" style={{ position: "sticky", top: 14, zIndex: 50, margin: "14px auto 0", maxWidth: 1040, borderRadius: 22, padding: "0 8px" }}>
      <div style={{ display: "flex", height: 60, alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark size="sm" markSrc="../../assets/vale-mark.png" />
          <span style={{ width: 1, height: 22, background: "var(--glass-line)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--role-accent)", border: "1px solid color-mix(in srgb, var(--role-accent) 40%, transparent)", background: "color-mix(in srgb, var(--role-accent) 12%, transparent)", padding: "4px 10px", borderRadius: 999 }}>
            {role === "client" ? "Klijent" : "Dispečer"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rd-in" style={{ width: "auto", padding: "7px 10px", fontSize: 12, borderRadius: 10 }}>
            <option value="client">Klijent</option>
            <option value="dispatcher">Dispečer</option>
          </select>
          <button style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-line)", borderRadius: 12, width: 38, height: 38, display: "grid", placeItems: "center", color: "var(--brass)", cursor: "pointer" }}>
            <Icon name="bell" size={18} />
            <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: "50%", background: "var(--mint)", boxShadow: "0 0 8px var(--mint)" }} />
          </button>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 13.5, cursor: "pointer" }}>Odjava</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 22, padding: "0 16px", borderTop: "1px solid var(--glass-line)" }}>
        {tabs.map((t) => (
          <button key={t.key} className={"rd-tab" + (active === t.key ? " on" : "")} onClick={() => onNav(t.key)}>
            {t.label}{active === t.key ? <span className="ink" /> : null}
          </button>
        ))}
      </div>
    </header>
  );
}

const page = { maxWidth: 1040, margin: "0 auto", padding: "26px 20px 60px" };

// ── Login ────────────────────────────────────────────────────
function RdLogin({ onLogin }) {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="rd-rise" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 26 }}>
          <img src="../../assets/vale-mark.png" alt="Valé" style={{ width: 168, maxWidth: "70%", height: "auto", display: "block" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1 }}>Valé</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "3px", color: "var(--text-faint)" }}>PREMIUM CAR CONCIERGE</div>
        </div>
        <div className="glass" style={{ padding: 30 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 700, letterSpacing: "-.6px", margin: "0 0 4px" }}>Dobro došli nazad</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 22px" }}>Pristupite svojim zahtevima i poslovima.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><span className="rd-label">Email</span><input className="rd-in" defaultValue="marko@primer.rs" /></div>
            <div><span className="rd-label">Lozinka</span><input className="rd-in" type="password" defaultValue="demolozinka" /></div>
            <button className="rd-btn rd-shimmer" style={{ width: "100%", marginTop: 4 }} onClick={onLogin}>Prijavi se</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-faint)", fontSize: 12, margin: "2px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--glass-line)" }} /> ili <span style={{ flex: 1, height: 1, background: "var(--glass-line)" }} />
            </div>
            <button className="rd-btn-ghost" style={{ width: "100%" }} onClick={onLogin}><Icon name="user" size={16} /> Nastavi sa Google</button>
          </div>
        </div>
        <p style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 13, marginTop: 18 }}>Nemate nalog? <a href="#" style={{ color: "var(--brass-soft)" }}>Registracija</a></p>
      </div>
    </div>
  );
}

// ── Client Home (bento) ──────────────────────────────────────
function Home({ requests, onOpen, onNew }) {
  const active = requests.filter((r) => !TERMINAL.includes(r.status));
  const history = requests.filter((r) => TERMINAL.includes(r.status));
  const hero = active[0];
  const rest = active.slice(1);
  return (
    <div style={page}>
      <div className="rd-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brass-soft)", letterSpacing: ".6px", marginBottom: 8 }}>SREDA · 13. MART</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-1px", margin: 0 }}>Zdravo, Marko 👋</h1>
        </div>
        <button className="rd-btn" onClick={onNew}><Icon name="plus" size={17} /> Novi zahtev</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
        {/* Hero active job */}
        {hero ? (
          <div className="glass rd-rise rd-card-hover" style={{ gridColumn: "span 7", padding: 26, cursor: "pointer", animationDelay: ".06s" }} onClick={() => onOpen(hero.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <IconWell name={hero.icon} accent />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600 }}>{hero.make} · {hero.year}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>Preuzimanje {hero.date} · {hero.from}–{hero.to}</div>
                </div>
              </div>
              <StatusPill status={hero.status} big />
            </div>
            <LiveTracker status={hero.status} />
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>{hero.services.map((s) => <Chip key={s}>{s}</Chip>)}</div>
          </div>
        ) : null}

        {/* Stat tiles */}
        <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".12s", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-1.5px", background: "var(--brass-grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{active.length}</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>aktivnih zahteva u toku</div>
          </div>
          <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".18s", flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", color: "var(--mint)", background: "rgba(111,211,163,0.12)" }}><Icon name="check" size={22} /></span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{history.length} završeno</div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>u poslednjih 30 dana</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lists */}
      {rest.length ? (
        <>
          <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-dim)", margin: "30px 0 14px" }}>Ostali aktivni</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {rest.map((r, i) => <RequestTile key={r.id} r={r} i={i} onClick={() => onOpen(r.id)} />)}
          </div>
        </>
      ) : null}

      {history.length ? (
        <>
          <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-dim)", margin: "30px 0 14px" }}>Istorija</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {history.map((r, i) => <RequestTile key={r.id} r={r} i={i} onClick={() => onOpen(r.id)} />)}
          </div>
        </>
      ) : null}
    </div>
  );
}

function RequestTile({ r, i, onClick }) {
  return (
    <div className="glass-soft rd-rise rd-card-hover" style={{ padding: 18, cursor: "pointer", animationDelay: `${0.06 * i + 0.1}s` }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <IconWell name={r.icon} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{r.make} · {r.year}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{r.date} · {r.from}–{r.to}</div>
          </div>
        </div>
        <StatusPill status={r.status} />
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap" }}>{r.services.map((s) => <Chip key={s}>{s}</Chip>)}</div>
    </div>
  );
}

// ── New Request ──────────────────────────────────────────────
const SERVICE_OPTS = [
  { label: "Servis", icon: "wrench" }, { label: "Gume", icon: "tire" },
  { label: "Tehnički", icon: "clipboard" }, { label: "Pranje / detailing", icon: "wash" },
  { label: "Registracija", icon: "check" }, { label: "Prevoz", icon: "truck" },
];
function RdNewRequest({ onCreate, onCancel }) {
  const [picked, setPicked] = useState(["Gume"]);
  const toggle = (s) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  return (
    <div style={{ ...page, maxWidth: 720 }}>
      <button className="rd-rise" onClick={onCancel} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--text-dim)", fontSize: 14, cursor: "pointer", marginBottom: 18 }}><Icon name="arrowLeft" size={16} /> Nazad</button>
      <div className="rd-rise" style={{ animationDelay: ".04s", marginBottom: 22 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-.8px", margin: "0 0 4px" }}>Novi zahtev</h1>
        <p style={{ fontSize: 14, color: "var(--text-dim)", margin: 0 }}>Vozilo, usluge i adresa preuzimanja — gotovo za minut.</p>
      </div>
      <div className="glass rd-rise" style={{ padding: 26, animationDelay: ".1s" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div><span className="rd-label">Vozilo</span><input className="rd-in" defaultValue="Mercedes C200" /></div>
            <div><span className="rd-label">Godište</span><input className="rd-in" defaultValue="2020" /></div>
          </div>
          <div>
            <span className="rd-label">Usluge</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {SERVICE_OPTS.map((s) => {
                const on = picked.includes(s.label);
                return (
                  <button key={s.label} onClick={() => toggle(s.label)} style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                    border: `1px solid ${on ? "var(--brass)" : "var(--glass-line)"}`,
                    background: on ? "color-mix(in srgb, var(--brass) 13%, transparent)" : "rgba(255,255,255,0.03)",
                    color: on ? "var(--brass-soft)" : "var(--text-dim)", fontSize: 13, fontWeight: 500,
                    transition: "all .18s cubic-bezier(.2,1,.3,1)", transform: on ? "translateY(-1px)" : "none",
                    boxShadow: on ? "0 8px 18px -10px rgba(201,168,106,0.5)" : "none",
                  }}>
                    <Icon name={s.icon} size={17} /> {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div><span className="rd-label">Adresa preuzimanja</span><input className="rd-in" defaultValue="Bulevar oslobođenja 76, Novi Sad" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><span className="rd-label">Datum</span><input className="rd-in" defaultValue="16.03.2026" /></div>
            <div><span className="rd-label">Termin</span><select className="rd-in"><option>09:00–11:00</option><option>13:00–15:00</option></select></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
            <button className="rd-btn-ghost" onClick={onCancel}>Odustani</button>
            <button className="rd-btn rd-shimmer" onClick={() => onCreate({ make: "Mercedes C200", year: 2020, services: picked.length ? picked : ["Servis"], icon: picked[0] === "Gume" ? "tire" : "wrench" })}>Pošalji zahtev</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Request Detail ───────────────────────────────────────────
function Detail({ r, onBack }) {
  return (
    <div style={{ ...page, maxWidth: 880 }}>
      <button className="rd-rise" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--text-dim)", fontSize: 14, cursor: "pointer", marginBottom: 18 }}><Icon name="arrowLeft" size={16} /> Nazad</button>
      <div className="rd-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 22, animationDelay: ".04s" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <IconWell name={r.icon} accent />
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-.8px", margin: 0 }}>{r.make} · {r.year}</h1>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>Preuzimanje {r.date} · {r.from}–{r.to}</div>
          </div>
        </div>
        <StatusPill status={r.status} big />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16 }}>
        <div className="glass rd-rise" style={{ padding: 26, animationDelay: ".1s" }}>
          <h2 style={{ fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-dim)", margin: "0 0 18px" }}>Tok zahteva</h2>
          <AnimatedStepper status={r.status} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".16s" }}>
            <h2 style={{ fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-dim)", margin: "0 0 12px" }}>Cena prevoza</h2>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, letterSpacing: "-1px", background: "var(--brass-grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{r.price} RSD</div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "8px 0 0" }}>Uslugu plaćate direktno serviseru.</p>
          </div>
          <div className="glass-soft rd-rise" style={{ padding: 22, animationDelay: ".22s" }}>
            <h2 style={{ fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-dim)", margin: "0 0 12px" }}>Usluge</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{r.services.map((s) => <Chip key={s}>{s}</Chip>)}</div>
          </div>
          <button className="rd-btn-ghost rd-rise" style={{ animationDelay: ".28s" }}><Icon name="headset" size={16} /> Kontakt dispečer</button>
        </div>
      </div>
    </div>
  );
}

// ── Dispatcher Board ─────────────────────────────────────────
function Board({ requests, onOpen }) {
  const COLS = [
    { key: "new", label: "Novi", st: ["CREATED"], c: "var(--brass)" },
    { key: "offer", label: "Ponuda", st: ["OFFER_SENT"], c: "var(--brass-soft)" },
    { key: "confirmed", label: "Potvrđeni", st: ["CONFIRMED", "DRIVER_ASSIGNED"], c: "var(--mint)" },
    { key: "progress", label: "U toku", st: ["PICKED_UP", "AT_SERVICE", "SERVICE_DONE", "RETURNING", "DELIVERED"], c: "var(--mint)" },
    { key: "done", label: "Završeni", st: ["CLOSED"], c: "var(--text-dim)" },
  ];
  return (
    <div style={page}>
      <div className="rd-rise" style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-.8px", margin: "0 0 4px" }}>Tabla</h1>
        <p style={{ fontSize: 14, color: "var(--text-dim)", margin: 0 }}>Svi zahtevi po statusu — klik otvara detalj.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        {COLS.map((col, ci) => {
          const items = requests.filter((r) => col.st.includes(r.status));
          return (
            <div key={col.key} className="glass-soft rd-rise" style={{ padding: 12, animationDelay: `${ci * 0.06}s`, minHeight: 120 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 2px" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.c, boxShadow: `0 0 8px ${col.c}` }} />{col.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--text-dim)" }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {items.length === 0 ? (
                  <p style={{ borderRadius: 12, border: "1px dashed var(--glass-line)", padding: "18px 6px", textAlign: "center", fontSize: 11, color: "var(--text-faint)", margin: 0 }}>—</p>
                ) : items.map((r, i) => (
                  <div key={r.id} className="rd-card-hover" onClick={() => onOpen(r.id)} style={{ cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-line)", borderRadius: 14, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--brass)", background: "rgba(201,168,106,0.1)", flexShrink: 0 }}><Icon name={r.icon} size={15} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.make}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.client}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{r.services.slice(0, 2).map((s) => <span key={s} style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--text-faint)" }}>{s}</span>)}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", marginTop: 8 }}>{r.date} · {r.from}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────
function RedesignApp() {
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState("client");
  const [requests, setRequests] = useState(SEED);
  const [screen, setScreen] = useState("home");
  const [openId, setOpenId] = useState(null);

  if (!authed) {
    return <div data-role="client"><RdLogin onLogin={() => { setAuthed(true); setScreen("home"); }} /></div>;
  }

  const tabs = role === "client"
    ? [{ key: "home", label: "Početna" }, { key: "new", label: "Novi zahtev" }]
    : [{ key: "board", label: "Tabla" }];

  const active = role === "client"
    ? (["home", "new", "detail"].includes(screen) ? screen : "home")
    : (["board", "detail"].includes(screen) ? screen : "board");
  const openR = requests.find((r) => r.id === openId);

  function createRequest(data) {
    const r = { id: "r" + (requests.length + 1), date: "16.03", from: "09:00", to: "11:00", status: "CREATED", client: "Marko Jovanović", price: "—", ...data };
    setRequests([r, ...requests]); setScreen("home");
  }

  let body;
  if (active === "detail" && openR) body = <Detail r={openR} onBack={() => setScreen(role === "client" ? "home" : "board")} />;
  else if (role === "client" && active === "new") body = <RdNewRequest onCreate={createRequest} onCancel={() => setScreen("home")} />;
  else if (role === "client") body = <Home requests={requests} onOpen={(id) => { setOpenId(id); setScreen("detail"); }} onNew={() => setScreen("new")} />;
  else body = <Board requests={requests} onOpen={(id) => { setOpenId(id); setScreen("detail"); }} />;

  const tabActive = active === "detail" ? (role === "client" ? "home" : "board") : active;

  return (
    <div data-role={role} style={{ minHeight: "100dvh" }}>
      <Header role={role} setRole={(r) => { setRole(r); setScreen(r === "client" ? "home" : "board"); setOpenId(null); }}
        tabs={tabs} active={tabActive} onNav={(k) => { setScreen(k); setOpenId(null); }} onSignOut={() => setAuthed(false)} />
      <div key={screen + role + (openId || "")} className="rd-fade">{body}</div>
    </div>
  );
}

window.AutoConciergeAppRedesign = RedesignApp;
