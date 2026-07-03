/**
 * Uvoz destinacija iz kuriranog .xlsx (7 sheet-ova = kategorije) u kolekciju `partners`.
 * Kolone se mapiraju iz zaglavlja (Naziv / Adresa / Telefon / Radno vreme).
 *
 * Dry-run:  tsx scripts/import-partners-xlsx.ts [put/do.xlsx]
 * Upis:     GOOGLE_APPLICATION_CREDENTIALS=/put/key.json tsx scripts/import-partners-xlsx.ts [.xlsx] --write
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type ServiceType = "service" | "technical" | "registration" | "tires" | "wash" | "other";

const XLSX = process.argv.find((a) => a.endsWith(".xlsx")) || "/Users/srdjankokot/Downloads/Auto_servisi_Novi_Sad.xlsx";

const SHEET_TYPES: Record<string, ServiceType[]> = {
  "Auto servisi": ["service"],
  "Auto-plin (LPG)": ["service"],
  "Limari i farbari": ["service"],
  "Registracija vozila": ["registration", "technical"],
  Vulkanizeri: ["tires"],
  Autoperionice: ["wash"],
  Ostalo: ["other"],
};

function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function sheetsOf(dir: string): { name: string; file: string }[] {
  const wb = readFileSync(join(dir, "xl/workbook.xml"), "utf8");
  const rels = readFileSync(join(dir, "xl/_rels/workbook.xml.rels"), "utf8");
  const relMap: Record<string, string> = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1];
    const target = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (id && target) relMap[id] = target;
  }
  const out: { name: string; file: string }[] = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(m[0])?.[1];
    const rid = /r:id="([^"]+)"/.exec(m[0])?.[1];
    if (name && rid && relMap[rid]) {
      const rel = relMap[rid].replace(/^\/+/, "");
      const file = rel.startsWith("xl/") ? join(dir, rel) : join(dir, "xl", rel);
      out.push({ name: decode(name), file });
    }
  }
  return out;
}

function parseRows(file: string): Record<number, Record<string, string>> {
  const xml = readFileSync(file, "utf8");
  const rows: Record<number, Record<string, string>> = {};
  for (const m of xml.matchAll(/<c r="([A-Z]+)(\d+)"[^>]*>([\s\S]*?)<\/c>/g)) {
    const t = /<t[^>]*>([\s\S]*?)<\/t>/.exec(m[3]);
    if (t) (rows[+m[2]] ||= {})[m[1]] = decode(t[1]);
  }
  return rows;
}

interface PartnerSeed {
  name: string;
  address: string;
  phone: string;
  serviceTypes: ServiceType[];
  note: string;
  sheet: string;
}

function build(dir: string): PartnerSeed[] {
  const out: PartnerSeed[] = [];
  const seen = new Set<string>();
  for (const sheet of sheetsOf(dir)) {
    const types = SHEET_TYPES[sheet.name] ?? ["other"];
    const rows = parseRows(sheet.file);
    const header = rows[1] ?? {};
    const colOf = (re: RegExp) => Object.keys(header).find((c) => re.test(header[c]));
    const cName = colOf(/naziv/i);
    const cAddr = colOf(/adres/i);
    const cPhone = colOf(/telefon/i);
    const cHours = colOf(/radno/i);
    if (!cName) continue;
    for (const rn of Object.keys(rows).map(Number).filter((n) => n >= 2).sort((a, b) => a - b)) {
      const r = rows[rn];
      const name = (cName && r[cName])?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const rawAddr = (cAddr && r[cAddr])?.trim() || "";
      const address = rawAddr ? (/novi sad|petrovaradin|sremska kamenica/i.test(rawAddr) ? rawAddr : `${rawAddr}, Novi Sad`) : `${name}, Novi Sad`;
      out.push({
        name,
        address,
        phone: (cPhone && r[cPhone])?.trim() || "",
        serviceTypes: types,
        note: (cHours && r[cHours])?.trim() || "",
        sheet: sheet.name,
      });
    }
  }
  return out;
}

function htmlImporter(docs: unknown[]): string {
  const FIREBASE = {
    apiKey: "AIzaSyBxook6KrFPHLJkNUoHN90wLqwpHxEXWcA",
    authDomain: "carconcierge-1bcb8.firebaseapp.com",
    projectId: "carconcierge-1bcb8",
    storageBucket: "carconcierge-1bcb8.firebasestorage.app",
    messagingSenderId: "1008578916838",
    appId: "1:1008578916838:web:37138072fcb9684845e627",
  };
  return `<!DOCTYPE html>
<html lang="sr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Uvoz partnera — Valé</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0a110d;color:#eef2ed;max-width:560px;margin:40px auto;padding:0 20px;line-height:1.5}
  h1{font-size:22px}
  input{width:100%;padding:11px 13px;margin:6px 0;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#eef2ed;font-size:15px}
  button{margin-top:12px;padding:12px 22px;border:none;border-radius:11px;background:linear-gradient(135deg,#e0c184,#c9a86a 55%,#a67f3d);color:#1a130a;font-weight:600;font-size:15px;cursor:pointer}
  button:disabled{opacity:.5;cursor:default}
  #log{margin-top:16px;font-family:ui-monospace,monospace;font-size:12.5px;color:#9db0a3;white-space:pre-wrap;max-height:300px;overflow:auto}
  .muted{color:#6b8275;font-size:13px}
  code{color:#d8bd8a}
</style></head>
<body>
  <h1>Uvoz partnera (${docs.length})</h1>
  <p class="muted">Prijavi se kao <b>dispečer</b> pa klikni „Uvezi". Pravila dozvoljavaju dispečeru upis u <code>partners</code>. Postojeći (po nazivu) se preskaču.</p>
  <input id="email" type="email" placeholder="dispečer email" autocomplete="username">
  <input id="pass" type="password" placeholder="lozinka" autocomplete="current-password">
  <button id="go">Uvezi</button>
  <div id="log"></div>
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
    import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
    import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
    import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-functions.js";
    const app = initializeApp(${JSON.stringify(FIREBASE)});
    const auth = getAuth(app); const db = getFirestore(app);
    const PARTNERS = ${JSON.stringify(docs)};
    const logEl = document.getElementById("log");
    const log = (m) => { logEl.textContent += m + "\\n"; logEl.scrollTop = logEl.scrollHeight; };
    document.getElementById("go").onclick = async () => {
      const btn = document.getElementById("go"); btn.disabled = true;
      try {
        log("Prijava…");
        const cred = await signInWithEmailAndPassword(auth, document.getElementById("email").value.trim(), document.getElementById("pass").value);
        log("Usklađujem ulogu (claim) sa profilom…");
        try { const r = await httpsCallable(getFunctions(app, "europe-west1"), "resyncMyRole")(); log("Profil uloga: " + ((r.data && r.data.role) || "?")); } catch (e) { log("resync: " + (e && e.message ? e.message : e)); }
        await cred.user.getIdToken(true);
        const tok = await cred.user.getIdTokenResult();
        log("Claim posle usklađivanja: " + (tok.claims.role || "(nema)"));
        if (tok.claims.role !== "dispatcher") { log("Profil nije dispečer — upis odbijen."); btn.disabled = false; return; }
        log("Učitavam postojeće partnere…");
        const snap = await getDocs(collection(db, "partners"));
        const seen = new Set(snap.docs.map((d) => (d.data().name || "").toLowerCase().trim()));
        let added = 0, skipped = 0;
        for (const p of PARTNERS) {
          if (seen.has(p.name.toLowerCase().trim())) { skipped++; continue; }
          await addDoc(collection(db, "partners"), Object.assign({}, p, { createdAt: serverTimestamp() }));
          added++; log("+ " + p.name);
        }
        log("\\nGotovo. Dodato: " + added + ", preskočeno: " + skipped);
      } catch (e) { log("GREŠKA: " + (e && e.message ? e.message : e)); btn.disabled = false; }
    };
  </script>
</body></html>`;
}

async function main() {
  const write = process.argv.includes("--write");
  const dir = mkdtempSync(join(tmpdir(), "xlsx-"));
  execSync(`unzip -oq "${XLSX}" -d "${dir}"`);
  const partners = build(dir);

  const bySheet: Record<string, number> = {};
  partners.forEach((p) => (bySheet[p.sheet] = (bySheet[p.sheet] || 0) + 1));
  console.log(`Ukupno destinacija: ${partners.length}  ·  sa telefonom: ${partners.filter((p) => p.phone).length}`);
  Object.entries(bySheet).forEach(([s, n]) => console.log(`  ${s}: ${n} [${SHEET_TYPES[s]?.join(",") ?? "other"}]`));
  console.log("\nPrimeri:");
  partners.slice(0, 10).forEach((p) => console.log(`  • ${p.name} — ${p.address}${p.phone ? " — " + p.phone : ""}  [${p.serviceTypes.join(",")}]`));

  if (process.argv.includes("--emit")) {
    const { writeFileSync, mkdirSync } = await import("node:fs");
    const docs = partners.map((p) => ({
      name: p.name,
      address: p.address,
      phone: p.phone,
      serviceTypes: p.serviceTypes,
      makes: [] as string[],
      isActive: true,
      note: p.note,
      source: "xlsx",
    }));
    mkdirSync("scripts/out", { recursive: true });
    writeFileSync("scripts/out/partners.json", JSON.stringify(docs, null, 2));
    writeFileSync("scripts/out/import-partners.html", htmlImporter(docs));
    console.log(`Emitovano:\n  scripts/out/partners.json (${docs.length} dokumenata)\n  scripts/out/import-partners.html (otvori u browseru, prijava kao dispečer, Uvezi)`);
    return;
  }

  if (!write) {
    console.log("\n(DRY-RUN — ništa nije upisano. Opcije: --emit (JSON + HTML importer) ili --write uz GOOGLE_APPLICATION_CREDENTIALS.)");
    return;
  }

  const { applicationDefault, initializeApp } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  initializeApp({ credential: applicationDefault() });
  const db = getFirestore();
  const existing = new Set((await db.collection("partners").get()).docs.map((d) => (d.data().name || "").toLowerCase().trim()));
  let added = 0;
  for (const p of partners) {
    if (existing.has(p.name.toLowerCase().trim())) continue;
    await db.collection("partners").add({
      name: p.name,
      address: p.address,
      phone: p.phone,
      serviceTypes: p.serviceTypes,
      makes: [],
      isActive: true,
      note: p.note,
      source: "xlsx",
      createdAt: FieldValue.serverTimestamp(),
    });
    added++;
  }
  console.log(`\nUpisano novih: ${added} (preskočeno postojećih po nazivu: ${partners.length - added})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
