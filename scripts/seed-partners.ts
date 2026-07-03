/**
 * Uvoz destinacija (servisi / vulkanizeri / perionice / registracija-tehnički) iz
 * OpenStreetMap za Novi Sad u kolekciju `partners`.
 *
 * Podaci: © OpenStreetMap contributors (ODbL) — otvoreni podaci, uz atribuciju.
 *
 * Dry-run (podrazumevano):  tsx scripts/seed-partners.ts
 *   → samo povuče i prikaže koliko ih ima + primere, NIŠTA ne upisuje.
 * Upis u bazu:              GOOGLE_APPLICATION_CREDENTIALS=/put/do/key.json tsx scripts/seed-partners.ts --write
 */

const BBOX = "45.20,19.74,45.33,19.94"; // Novi Sad (jug,zapad,sever,istok)
const OVERPASS = "https://overpass-api.de/api/interpreter";

type ServiceType = "service" | "technical" | "registration" | "tires" | "wash" | "other";

interface OsmEl {
  type: string;
  id: number;
  tags?: Record<string, string>;
}
interface PartnerSeed {
  name: string;
  address: string;
  phone: string;
  serviceTypes: ServiceType[];
}

function classify(t: Record<string, string>): ServiceType[] {
  const s = new Set<ServiceType>();
  const name = (t.name || "").toLowerCase();
  if (t.shop === "car_repair") s.add("service");
  if (t.shop === "tyres" || /vulkaniz|вулканиз|гум/.test(name)) s.add("tires");
  if (t.amenity === "car_wash" || /perionic|периониц|autoperion|detailing|детаилинг/.test(name)) s.add("wash");
  if (/registracij|регистрациј/.test(name)) s.add("registration");
  if (/tehni[čc]k|техничк/.test(name)) s.add("technical");
  return [...s];
}

function buildAddress(t: Record<string, string>): string {
  const street = t["addr:street"];
  const hn = t["addr:housenumber"];
  if (street) return `${street}${hn ? " " + hn : ""}, Novi Sad`;
  if (t["addr:full"]) return /novi sad/i.test(t["addr:full"]) ? t["addr:full"] : `${t["addr:full"]}, Novi Sad`;
  return `${t.name}, Novi Sad`;
}

async function fetchOsm(): Promise<OsmEl[]> {
  const q = `[out:json][timeout:90];
(
  nwr["shop"="car_repair"](${BBOX});
  nwr["shop"="tyres"](${BBOX});
  nwr["amenity"="car_wash"](${BBOX});
  nwr["name"~"vulkaniz|вулканиз|гум|registracij|регистрациј|tehni|техничк|perionic|периониц",i](${BBOX});
);
out tags;`;
  const res = await fetch(OVERPASS, {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "CarConcierge/1.0 (partner directory import; Novi Sad)",
    },
  });
  if (!res.ok) throw new Error("Overpass " + res.status);
  const j = (await res.json()) as { elements: OsmEl[] };
  return j.elements;
}

function toPartners(els: OsmEl[]): PartnerSeed[] {
  const out: PartnerSeed[] = [];
  const seen = new Set<string>();
  for (const el of els) {
    const t = el.tags || {};
    if (!t.name) continue;
    const serviceTypes = classify(t);
    if (serviceTypes.length === 0) continue;
    const key = t.name.toLowerCase().trim() + "|" + (t["addr:street"] || "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: t.name.trim(),
      address: buildAddress(t),
      phone: (t.phone || t["contact:phone"] || t["contact:mobile"] || "").trim(),
      serviceTypes,
    });
  }
  return out;
}

async function main() {
  const write = process.argv.includes("--write");
  const els = await fetchOsm();
  const partners = toPartners(els);

  const byType = (ty: ServiceType) => partners.filter((p) => p.serviceTypes.includes(ty)).length;
  console.log(`OSM elemenata: ${els.length}  →  destinacija: ${partners.length}`);
  console.log(`  servis: ${byType("service")} · gume: ${byType("tires")} · pranje: ${byType("wash")} · registracija: ${byType("registration")} · tehnički: ${byType("technical")}`);
  console.log(`  sa telefonom: ${partners.filter((p) => p.phone).length} / ${partners.length}`);
  console.log("\nPrimeri:");
  partners.slice(0, 15).forEach((p) => console.log(`  • ${p.name} — ${p.address}${p.phone ? " — " + p.phone : ""}  [${p.serviceTypes.join(",")}]`));

  if (!write) {
    console.log("\n(DRY-RUN — ništa nije upisano. Za upis: --write uz GOOGLE_APPLICATION_CREDENTIALS.)");
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
      source: "osm",
      note: "Uvezeno iz OpenStreetMap",
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
