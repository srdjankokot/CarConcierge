# Valé — Dispečerska tabla (Dispatcher Board)

Handoff za **jedan ekran**: operativna tabla dispečera za Valé (car-concierge, Novi Sad).
Dispečer odavde vidi sve dnevne zahteve, šta traži akciju, i napreduje poslove kroz
workflow. Tri pogleda na iste podatke, prebacuju se gore desno.

> **Ovo je prototip (in-browser React + Babel), ne production kod.** Cilj handoff-a:
> da ga rekreiraš u svom stack-u (Next.js/React + vaše komponente). Lifuj logiku,
> tokene i ponašanje — ne kopiraj 1:1.

---

## Pogledi (3)

1. **Raspored (timeline)** — *default.* Dan po satima (07–19h), jedan red po vozaču
   + red „Nedodeljeno" na vrhu. Svaki posao je blok pozicioniran po prozoru
   preuzimanja (`from`–`to`). Vertikalna „SAD" linija pokazuje trenutno vreme.
   Preklapanja u istom redu (vozač ne može biti na dva mesta) označena su upozorenjem.
   Klik na blok → popover sa statusom, terminom, vozačem + brza akcija i „Vidi sve detalje".
2. **Lista (triage worklist)** — gusta lista sortirana **po hitnosti**
   (kasni → treba akcija → čeka → u toku → završeno). Filteri sa brojačima, pretraga,
   inline akcija na svakom redu (Pošalji ponudu / Dodeli vozača / sledeći korak),
   poziv klijentu, i strelica „›" za pun detalj.
3. **Kanban** — kartice grupisane po statusu u 5 kolona
   (Novi / Ponuda / Potvrđeno / U toku / Završeno). Klik na karticu → detalji.
   Sekundaran pogled; za dnevni rad preporuka su **Lista + Raspored**.

Sva tri dele istu **KPI traku** (Treba akcija / Čeka klijenta / U toku / Kasni)
i isti **detalj panel** (slide-over zdesna) sa kompletnim informacijama o poslu:
vozilo, klijent, telefon, termin, vozač, usluge, **tok statusa** (vertikalna
vremenska linija svih faza) i akcije.

---

## Model podataka

Jedan zahtev (`request`):

```js
{
  id, make, year, plate, client, phone,
  from, to,            // prozor preuzimanja, "HH:MM"
  status,              // vidi dole
  driver,              // ime vozača ili null
  services: [string],  // npr. ["Gume", "Detailing"]
}
```

### Statusi (workflow)

Redosled napredovanja (`ORDER`):
`CREATED → OFFER_SENT → CONFIRMED → DRIVER_ASSIGNED → PICKED_UP → AT_SERVICE →
SERVICE_DONE → RETURNING → DELIVERED → CLOSED`
(+ vanredni: `REJECTED`, `CANCELLED`)

Svaki status ima **`kind`** koji vodi sortiranje, boje i KPI brojače:

| kind | značenje | statusi | boja |
|---|---|---|---|
| `action` | dispečer mora nešto da uradi | CREATED, CONFIRMED | brass |
| `wait` | čeka klijenta | OFFER_SENT | brass-soft |
| `live` | u toku | DRIVER_ASSIGNED … RETURNING | mint |
| `done` | gotovo | DELIVERED, CLOSED | sage |
| `bad` | otkazano/odbijeno | REJECTED, CANCELLED | warn |

**`nextStep(status)`** vraća sledeću akciju (labela, ciljni status, da li je primarna,
da li traži izbor vozača). To je jedina „pravila" tabela koju treba preneti — sve
dugmad i auto-prelaz (npr. dodela vozača na `CONFIRMED` → `DRIVER_ASSIGNED`) izlaze iz nje.

**`isLate(r)`** = posao u fazi pre preuzimanja (`CREATED/OFFER_SENT/CONFIRMED/DRIVER_ASSIGNED`)
čiji je `from` već prošao u odnosu na „sad" (`NOW_MIN`). U prototipu je „sad" fiksiran
na 10:30 radi demo-a — u produkciji koristi realno vreme.

---

## Fajlovi

- `design-files/index.html` — shell: tokeni (link na `tokens.css`), ambient pozadina,
  glass i motion CSS, React mount. Bez zavisnosti od DS bundla.
- `design-files/DispatcherBoardApp.jsx.txt` — ceo ekran (svi pogledi + komponente + podaci).
  (`.txt` ekstenzija da ga alati ne pokupe; Babel ga svejedno učitava. Preimenuj u `.jsx`
  ako hoćeš da ga lintuješ/pokrećeš zasebno.) Jedan fajl radi lakšeg čitanja; u produkciji
  ga razbij na module (vidi dole).
- `design-files/tokens.css` — boje, fontovi i glass/gradient tokeni, izvučeni 1:1 iz
  Auto Concierge dizajn sistema. Fontovi: **Sora** (display), **Inter** (body),
  **JetBrains Mono** (meta/labele).

Pokreni: otvori `design-files/index.html` u browseru (koristi CDN React/Babel).

---

## Mapa koda (`DispatcherBoardApp.jsx.txt`)

- **Ikonice** — `LPATHS` + `LIcon` (line-set, stroke=currentColor); `VIcon` za vozila/usluge.
- **Domen** — `SMETA` (status → labela/kind/boja), `ORDER`, `nextStep`, `isLate`,
  `t2m/m2t` (vreme↔minuti), `SEED` (10 demo zahteva), `DRIVERS`.
- **Deljene UI sitnice** — `StatusDot`, `StatusPill`, `VWell`, `Meta`, `DriverChip`,
  `DriverPicker`, `ActionBtn`, `primaryBtn/ghostBtn/iconBtn` stilovi.
- **`Kpis`** — KPI traka.
- **`Worklist`** (Lista) + `FILTERS`, `rankRow` (sortiranje po hitnosti).
- **`Timeline`** (Raspored) + `TimelineBlock`, `pct`, `laneOverlaps` (detekcija preklapanja).
- **`Kanban`** + `KCOLS`, `KanbanCard`.
- **`DetailDrawer`** (slide-over) + `statusHistory`, `DetailRow`.
- **`Header`**, **`Switcher`**, **`DispatcherBoardApp`** (root: drži `reqs`, `view`,
  `detailId`; `advance()` i `assign()` mutiraju stanje).

### Predlog modularizacije za produkciju
```
DispatcherBoard/
  index.tsx              // root: state, view switch
  model.ts               // SMETA, ORDER, nextStep, isLate, time utils, types
  views/TimelineView.tsx
  views/WorklistView.tsx
  views/KanbanView.tsx
  DetailDrawer.tsx
  components/            // StatusPill, DriverChip, Kpis, icons…
```

---

## Dizajn tokeni (u `tokens.css`)

Tema je **tamna „forest-green" + topla brass + mint „live" signal**, sa
glassmorphism površinama nad ambijentalnim sjajem.

- Tekst: `--text #eef2ed` · `--text-dim #9db0a3` · `--text-faint #6b8275`
- Brend: `--brass #c9a86a` · `--brass-soft #d8bd8a` · `--mint #6fd3a3` · `--warn #e0954a`
- Površine: `--glass`, `--glass-soft` (linear-gradient + `backdrop-filter: blur`),
  `--glass-border` (brass hairline), `--glass-line` (neutralni divider)
- Gradijenti: `--brass-grad`, `--mint-grad`
- Pozadina ekrana: `#0a110d`
- Role accent: dispečer = mint (`--role-accent: #6fd3a3`)
- Fontovi: `--font-display` Sora · `--font-body` Inter · `--font-mono` JetBrains Mono

Status boje izlaze iz `SMETA[...].c` (brass / brass-soft / mint / sage / warn).

---

## Napomene za implementaciju

- **Vreme je primarna osa**, ne faza — zato je Raspored default i zato Lista sortira
  po hitnosti. Kanban je tu jer je poznat, ali ne rešava „šta sad i kada".
- `NOW_MIN` je hard-kodiran (10:30) radi demo-a — zameni realnim vremenom; „SAD" linija
  i `isLate` zavise od njega.
- Detalj panel, popover i drawer se renderuju kroz `ReactDOM.createPortal` na `document.body`
  da izađu iz overflow kontejnera (bitno za timeline koji horizontalno skroluje).
- Akcije u prototipu samo menjaju lokalni `state` (`advance`, `assign`) — poveži ih na vaš API.
- Hit-targeti, gustina i font-veličine su podešeni za desktop dispečerski ekran.
