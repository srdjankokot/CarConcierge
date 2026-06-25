# Handoff: Valé Concierge App — Redesign (glass / bento / motion)

## Overview
Valé is a premium car-concierge service. A client books vehicle services (tires,
inspection, detailing, etc.); a driver picks the car up, takes it to the shop, and
returns it. This handoff covers the **app redesign** — a bold, dark "glassmorphism +
bento grid" direction with rich entrance/live-tracking motion. It has two roles:

- **Client** — Login → Home (bento dashboard of active/past requests) → New Request → Request Detail
- **Dispatcher** — a 5-column status Board (kanban) → Request Detail

All UI copy is in **Serbian (Latin)**. Keep it as-is unless localization is in scope.

## About the design files
The files in `design-files/` are a **design reference built in HTML + React (Babel,
in-browser)** — a prototype showing the intended look, layout, and motion. They are
**not production code to ship directly.**

Your task: **recreate these designs in the target codebase's existing environment**
(the live product is **Next.js / React**, so port to that and follow its conventions —
component structure, routing, data layer, styling approach). If you are starting fresh
with no environment, React + Next.js is the right choice to match the product. Lift the
exact visual values (colors, type, spacing, radii, motion) from this README and from
`design-tokens/`.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, gradients, and interactions are
all specified. Recreate the UI pixel-accurately using the design tokens below. The
motion is integral to the direction — replicate the entrance, stepper, and live-tracker
animations.

---

## Design language (apply everywhere)

- **Base**: near-black forest green. App shell background `#0a110d` (`--bg-deep`); the
  base token background is `#0d1410` (`--bg`).
- **Glass surfaces**: translucent panels over ambient glows.
  - `.glass`: `linear-gradient(155deg, rgba(28,46,36,.62), rgba(15,24,19,.52))`,
    `backdrop-filter: blur(22px) saturate(125%)`, `1px solid rgba(216,189,138,.14)`
    border, radius **24px**, shadow `0 24px 60px -28px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.05)`.
  - `.glass-soft`: `linear-gradient(155deg, rgba(24,38,30,.50), rgba(13,21,16,.42))`,
    `blur(16px) saturate(115%)`, `1px solid rgba(255,255,255,.06)`, radius **20px**.
- **Brass** is the primary brand accent `#c9a86a` (soft `#d8bd8a`). Primary CTAs and big
  numerals use the **brass gradient** `linear-gradient(135deg, #e0c184, #c9a86a 55%, #a67f3d)`.
- **Mint** `#6fd3a3` is the "live / success" signal (active step, online dot), with
  **mint gradient** `linear-gradient(135deg, #8fe7c0, #6fd3a3)` for progress fills.
- **Role accent** (`--role-accent`) is the ONLY thing that retints per role: client =
  brass `#c9a86a`, dispatcher = mint `#6fd3a3` (driver = violet `#a78bfa`). Set it on a
  `[data-role]` wrapper; tabs, role badge, and active markers read it.
- **Ambient background**: 3 large blurred radial glows (`blur(90px)`, opacity ~.32)
  drifting slowly behind the glass — brass top-right, mint bottom-left, violet center.
  `position: fixed; inset:0; z-index:0`, content sits at `z-index:1`.

### Typography
- **Display** — `Sora` (400/500/600/700), tight tracking (headings: `-0.8px` to `-1.5px`).
- **Body** — `Inter` (400/450/500/600).
- **Mono** — `JetBrains Mono` (500/600) for meta, eyebrows, badges, dates/times.
- Load via Google Fonts (see `design-tokens/tokens/fonts.css`).

### Color tokens (hex)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0d1410` | page background (base) |
| `--bg-deep` | `#0a110d` | app shell background |
| `--bg-2` | `#111b15` | inset panels |
| `--surface` | `#15211a` | cards / inputs |
| `--surface-2` | `#1a2a21` | raised chips, icon wells |
| `--border` | `#243a2d` | default hairline |
| `--border-soft` | `#1d2e24` | soft divider |
| `--text` | `#eef2ed` | primary text |
| `--text-dim` | `#9db0a3` | secondary / labels |
| `--text-faint` | `#6b8275` | tertiary / mono meta |
| `--brass` | `#c9a86a` | primary accent |
| `--brass-soft` | `#d8bd8a` | hover / eyebrow text |
| `--mint` | `#6fd3a3` | live / success |
| `--danger` | `#e26d6d` | errors |
| `--warn` | `#e0954a` | rejected / cancelled |
| `--role-accent` | brass→mint | per-role tint |

(Glass-layer literals — `--glass`, `--glass-soft`, `--glass-border` `rgba(216,189,138,.14)`,
`--glass-line` `rgba(255,255,255,.06)` — are in `design-tokens/tokens/effects.css`.)

### Spacing, radii, shadows
4-based spacing scale (`4,8,12,16,20,24,32,40,48,64,84`). Radii: input **10px**,
button **11–14px**, small card / step **14px**, card **16px**, glass-soft **20px**,
hero/header **22px**, glass card **24px**, pills **999px**. Full set in
`design-tokens/tokens/spacing.css` and `effects.css`.

### Motion (replicate)
- **rd-rise** — entrance: `opacity 0 → 1`, `translateY(16px) → 0`, `.6s cubic-bezier(.22,.9,.3,1)`.
  Staggered via per-element `animation-delay` (.06s steps) for the bento cascade.
- **rd-fade** — screen swap: `opacity 0 → 1`, `.5s`. Keyed on screen+role so it re-runs on nav.
- **rd-pop** — `scale(0) → 1`, `.45s cubic-bezier(.2,1.3,.4,1)` for dots appearing.
- **rd-pulse** — expanding ring on the active step/tracker dot: `scale(1)→2.6`, fading out, `1.9s` loop.
- **rd-shimmer** — diagonal light sweep across primary buttons, `3.6s` loop.
- **Card hover** — `translateY(-4px)` (tiles) / `-2px` (buttons), border + shadow lift, `.2s`.
- **Button hover** — `translateY(-2px)`, brighter, larger brass glow shadow.
- All motion is wrapped in `@media (prefers-reduced-motion: reduce)` → animations off,
  end-states shown. **Preserve this.**

---

## Screens / Views

### 1. Login (`RdLogin`)
- **Purpose**: authenticate; demo just calls `onLogin` for both buttons.
- **Layout**: full-viewport centered, single column, max-width **400px**. `rd-rise` on mount.
- **Components**:
  - Logo lockup: `vale-mark.png` (width 168px, max 70%), then "Valé" in Sora 34/700,
    tracking `-1px`; below it mono eyebrow "PREMIUM CAR CONCIERGE" 10.5px, letter-spacing 3px, `--text-faint`.
  - `.glass` card, padding 30px:
    - h1 "Dobro došli nazad" — Sora 25/700, tracking `-.6px`.
    - sub "Pristupite svojim zahtevima i poslovima." — `--text-dim` 14px.
    - Email field (label "Email", value `marko@primer.rs`) + Password ("Lozinka", `demolozinka`).
    - Primary button "Prijavi se" (full width, brass gradient + shimmer).
    - "ili" divider (hairlines + center text).
    - Ghost button "Nastavi sa Google" with `user` icon.
  - Footer: "Nemate nalog? **Registracija**" (brass-soft link).
- **Inputs** (`.rd-in`): bg `rgba(8,14,11,.6)`, border `--glass-line`, radius 13px,
  padding `13px 15px`, font 14.5px. Focus: brass border + `0 0 0 3px rgba(201,168,106,.14)` ring.

### 2. Header (`Header`, persistent after login)
- Sticky `.glass` bar, `top:14px`, max-width **1040px**, radius 22px. Two rows:
  - **Row 1 (height 60px)**: `BrandMark` (sm) + vertical hairline + role pill
    (mono, role-accent tinted — "Klijent" / "Dispečer") · right side: role `<select>`
    (Klijent/Dispečer, switches the whole app), bell button 38×38 with mint
    notification dot, "Odjava" text button.
  - **Row 2**: tab bar (`.rd-tab`), border-top hairline. Active tab gets full-color
    text + an `ink` underline (2px, role-accent, glowing). Client tabs: "Početna",
    "Novi zahtev". Dispatcher tab: "Tabla".

### 3. Client Home (`Home`) — bento dashboard
- **Layout**: max-width 1040px, `padding 26px 20px 60px`. 12-column grid, `gap 16px`.
  - **Header row**: mono date "SREDA · 13. MART" (brass-soft) + h1 "Zdravo, Marko 👋"
    (Sora 30/700, `-1px`); right: brass "+ Novi zahtev" button.
  - **Hero card** (`grid-column: span 7`, `.glass`, padding 26, clickable, hover-lift):
    accent `IconWell` + "{make} · {year}" (Sora 19/600) + mono pickup "Preuzimanje
    {date} · {from}–{to}"; top-right big `StatusPill`. Below: **LiveTracker** (4-step
    horizontal). Bottom: service `Chip`s.
  - **Stat tiles** (`span 5`, column of two `.glass-soft`):
    - Big numeral = active count (Sora 40/700, brass-gradient text clip) + "aktivnih zahteva u toku".
    - Mint check well + "{n} završeno" (Sora 22/700) + "u poslednjih 30 dana".
  - **"Ostali aktivni"** + **"Istorija"** sections: 2-col grids of `RequestTile`s
    (`.glass-soft`, 18px, hover-lift) — icon well, make·year, mono date, status pill, chips.
- Section headers: 13px/600 uppercase, letter-spacing .6px, `--text-dim`.

### 4. New Request (`RdNewRequest`)
- **Layout**: max-width **720px**. "← Nazad" ghost link, h1 "Novi zahtev" (Sora 28/700)
  + sub. One `.glass` card, fields stacked `gap 20px`:
  - Vozilo (2fr) + Godište (1fr) inputs.
  - **Usluge** — 3-col grid of toggle buttons (icon + label). Selected: brass border,
    `color-mix(in srgb, var(--brass) 13%, transparent)` fill, brass-soft text,
    `translateY(-1px)`, brass glow shadow. Options: Servis, Gume, Tehnički,
    Pranje / detailing, Registracija, Prevoz. Multi-select; defaults to ["Gume"].
  - Adresa preuzimanja (input). Datum + Termin (`<select>`: 09:00–11:00 / 13:00–15:00).
  - Footer right: ghost "Odustani" + brass+shimmer "Pošalji zahtev" (creates a CREATED
    request, prepends to list, returns Home).

### 5. Request Detail (`Detail`)
- **Layout**: max-width **880px**. "← Nazad", header (accent IconWell + make·year Sora
  26/700 + mono pickup + big StatusPill). Two-col grid `1.25fr / 1fr`, gap 16:
  - Left `.glass`: "Tok zahteva" label + **AnimatedStepper** (vertical, sequential reveal).
  - Right column (`.glass-soft` stack): "Cena prevoza" — big brass-gradient numeral
    "{price} RSD" + "Uslugu plaćate direktno serviseru."; "Usluge" chips; ghost button
    "Kontakt dispečer" (headset icon).

### 6. Dispatcher Board (`Board`)
- **Layout**: max-width 1040px. h1 "Tabla" + sub. **5-column grid** (`gap 12px`), each
  column a `.glass-soft` (padding 12, min-height 120), staggered entrance.
  - Columns: **Novi** (CREATED, brass) · **Ponuda** (OFFER_SENT, brass-soft) ·
    **Potvrđeni** (CONFIRMED, DRIVER_ASSIGNED, mint) · **U toku** (PICKED_UP, AT_SERVICE,
    SERVICE_DONE, RETURNING, DELIVERED, mint) · **Završeni** (CLOSED, text-dim).
  - Column head: glowing dot (column color) + label + count pill. Empty = dashed
    "—" placeholder.
  - **Cards**: `rgba(255,255,255,.04)` fill, `--glass-line` border, radius 14, padding
    12. 30×30 icon chip + make (ellipsis) + client name; up to 2 service mono-pills;
    mono date · time. Click → Detail.

---

## Shared components (in `design-files/`)

These three are imported from the design-system bundle in the prototype
(`window.AutoConciergeDesignSystem_d4d678`). Source for two of them is included so you
can port them:

- **`Icon.jsx`** — 24×24 stroke SVG icon, `currentColor`, props `name`, `size`,
  `strokeWidth`. Available names: `car, wrench, clipboard, search, user, headset,
  steering, tire, wash, truck, bell, arrowLeft, check, plus`.
- **`BrandMark.jsx`** — logo lockup; prop `size` ("sm"/…) and `markSrc` (path to
  `vale-mark.png`).
- **Local prototype pieces** (defined inside `RedesignApp.jsx`, port as components):
  `StatusPill`, `Chip`, `IconWell`, `AnimatedStepper`, `LiveTracker`, `Header`,
  `RequestTile`.

### Status model
Ordered lifecycle (`STEP_DEFS`): `CREATED` (Zahtev poslat) → `OFFER_SENT` (Ponuda
poslata) → `CONFIRMED` (Potvrđeno) → `DRIVER_ASSIGNED` (Vozač dodeljen) → `PICKED_UP`
(Vozilo preuzeto) → `AT_SERVICE` (Na usluzi) → `SERVICE_DONE` (Usluga gotova) →
`RETURNING` (Vraćanje) → `DELIVERED` (Isporučeno) → `CLOSED` (Zatvoreno). Terminal:
`CLOSED`, `REJECTED` (Odbijeno), `CANCELLED` (Otkazano). Pill color: mint for
DELIVERED/CLOSED, warn for REJECTED/CANCELLED, else role-accent.

- **AnimatedStepper** (detail): vertical list; on status change resets and reveals steps
  one-by-one every **160ms** up to the current status. Done = mint dot + check;
  active = brass-gradient dot + pulsing ring; connector line fills with mint gradient.
- **LiveTracker** (hero): compact horizontal 4-stop bar (Preuzeto · Na usluzi · Vraćanje
  · Vraćeno) mapping PICKED_UP/AT_SERVICE/RETURNING/DELIVERED; active dot pulses,
  completed connectors fill mint with staggered `transition-delay`.

---

## State management
Single root component (`RedesignApp`) holds:
- `authed` (bool) — gate Login vs app.
- `role` ("client" | "dispatcher") — drives tabs, accent, and which screens render.
- `requests` (array) — seeded with 4 demo records (`SEED`); New Request prepends.
- `screen` ("home" | "new" | "detail" | "board") and `openId` (selected request).

Request shape: `{ id, make, year, date, from, to, status, services[], client, icon, price }`.
In production, replace `SEED` with real data fetching and wire status transitions to the
backend. Role is a demo `<select>` today; in production it comes from auth/session.

## Design tokens
Full CSS variables are in `design-tokens/` (link `styles.css`, which `@import`s
fonts → colors → typography → spacing → effects → base). The prototype also defines a
few redesign-local literals inline in `design-files/index.html` (`--rd-bg`, `--glass`,
`--brass-grad`, etc.) — mirrored here in "Design language".

## Assets
- `assets/vale-mark.png` — Valé wordmark/logo used on Login and in the header BrandMark.
  (Sibling `vale-icon.png` / `vale-lockup.png` exist in the source project if needed.)
- All icons are inline SVG (`Icon.jsx`) — no image assets.
- Fonts: Google Fonts (Sora, Inter, JetBrains Mono).

## Files
- `design-files/index.html` — page shell: token link, redesign-local CSS (glass,
  motion, buttons, inputs), ambient background, React mount.
- `design-files/RedesignApp.jsx` — the full prototype (all screens + local components).
- `design-files/Icon.jsx`, `design-files/BrandMark.jsx` — shared brand components.
- `design-tokens/` — the design-system stylesheets (tokens + base utility classes).
- `assets/` — logo image.

To preview the original, open `index.html` in the source project under
`ui_kits/app-redesign/` (it depends on the compiled `_ds_bundle.js` there).
