// Generiše brass app ikonicu (512px) sa slovom "A" — bez eksternih biblioteka.
// PNG enkoder koristi ugrađeni zlib. Pokretanje: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const N = 512;

// CRC32 (standardna tabela)
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}
// boje
const bgTop = [201, 168, 106]; // #c9a86a
const bgBot = [160, 126, 63]; // #a07e3f
const ink = [26, 19, 10]; // #1a130a

// geometrija slova A
const p = N * 0.2;
const y0 = p,
  y1 = N - p;
const cx = N / 2;
const halfW = ((N - 2 * p) / 2) * 0.92;
const t = N * 0.075;

function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let tt = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  tt = Math.max(0, Math.min(1, tt));
  const x = ax + tt * dx,
    y = ay + tt * dy;
  return Math.hypot(px - x, py - y);
}
const crossY = y0 + (y1 - y0) * 0.64;

function isInk(x, y) {
  const dl = distSeg(x, y, cx, y0, cx - halfW, y1);
  const dr = distSeg(x, y, cx, y0, cx + halfW, y1);
  if (dl < t / 2 || dr < t / 2) return true;
  // poprečna greda
  const barHalf = halfW * 0.42;
  if (Math.abs(y - crossY) < (t * 0.8) / 2 && Math.abs(x - cx) < barHalf) return true;
  return false;
}

// raster RGBA + PNG
const raw = Buffer.alloc(N * (1 + N * 4));
for (let y = 0; y < N; y++) {
  raw[y * (1 + N * 4)] = 0; // filter
  for (let x = 0; x < N; x++) {
    const off = y * (1 + N * 4) + 1 + x * 4;
    const tg = y / N;
    let r = lerp(bgTop[0], bgBot[0], tg);
    let g = lerp(bgTop[1], bgBot[1], tg);
    let b = lerp(bgTop[2], bgBot[2], tg);
    if (isInk(x, y)) {
      r = ink[0];
      g = ink[1];
      b = ink[2];
    }
    raw[off] = r;
    raw[off + 1] = g;
    raw[off + 2] = b;
    raw[off + 3] = 255;
  }
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0);
ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-512.png", png);
console.log("✓ public/icons/icon-512.png");
