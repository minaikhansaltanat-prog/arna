// Brand assets from one source file: content/brand/arna-logo-source.png (RGBA, transparent background, golden 3D sound wave that reads "ARNA").
//   node scripts/build-brand.mjs          (npm run brand)
// Cleans the source (the background was cut out of a picture, so the edge pixels are near-white and a few stray low-alpha dots float
// around the wave), trims the empty space, and writes into apps/web/public/brand/:
//   arna-logo-480.webp|png, arna-logo-960.webp|png      the logo, width 480 and 960 px
//   favicon-32.png, favicon-96.png                        rounded dark square, logo centred
//   apple-touch-icon.png (180), icon-192.png, icon-512.png, icon-maskable-512.png
//   ../og.png                                             1200x630 social card (the line under the logo is drawn into the picture)
// and apps/web/src/lib/brand.manifest.json (sizes, read by src/lib/brand.ts). The colours and proportions of the logo are never changed.
// When a designer delivers an SVG, change SRC here and the file names in src/lib/brand.ts: nothing else refers to the picture.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "content", "brand", "arna-logo-source.png");
const OUT = join(root, "apps", "web", "public", "brand");
const MANIFEST = join(root, "apps", "web", "src", "lib", "brand.manifest.json");
const TEAL = "#0E3B45"; // the site's dark base colour: the icon and the social card sit on it
const TEAL_DEEP = "#082A32";
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- 1. clean the source
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const A = (i) => data[i * 4 + 3];

/** binary dilation with a square window (two separable passes) */
function dilate(mask, r) {
  const tmp = new Uint8Array(W * H);
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      for (let k = Math.max(0, x - r); k <= Math.min(W - 1, x + r); k++) if (mask[y * W + k]) { tmp[y * W + x] = 1; break; }
    }
  }
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      for (let k = Math.max(0, y - r); k <= Math.min(H - 1, y + r); k++) if (tmp[k * W + x]) { out[y * W + x] = 1; break; }
    }
  }
  return out;
}

const solid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) solid[i] = A(i) >= 250 ? 1 : 0;
const near = dilate(solid, 6);
// the core: solid pixels with no soft pixel within 2 px. The outer ring of the shape is a blend with the old white background,
// so its colour is rebuilt from the core, not only the transparent edge pixels
const notSolid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) notSolid[i] = solid[i] ? 0 : 1;
const nearSoft = dilate(notSolid, 2);
const core = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) core[i] = solid[i] && !nearSoft[i] ? 1 : 0;

let dust = 0;
let fringe = 0;
const recolor = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (A(i) === 0) continue;
    if (!near[i]) {
      // a stray dot far from the wave
      data[i * 4 + 3] = 0;
      dust++;
    } else if (!core[i]) recolor[i] = 1;
  }
}
// two passes so the new colours do not feed on each other: read from the core only
const source = Buffer.from(data);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!recolor[i]) continue;
    let sr = 0, sg = 0, sb = 0, sw = 0;
    for (let r = 1; r <= 8 && sw === 0; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (!core[j]) continue;
          const w = 1 / (dx * dx + dy * dy);
          sr += source[j * 4] * w;
          sg += source[j * 4 + 1] * w;
          sb += source[j * 4 + 2] * w;
          sw += w;
        }
      }
    }
    if (sw > 0) {
      data[i * 4] = Math.round(sr / sw);
      data[i * 4 + 1] = Math.round(sg / sw);
      data[i * 4 + 2] = Math.round(sb / sw);
      fringe++;
    }
  }
}

// trim the empty space (keep a few pixels so the soft edges are not cut)
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (A(y * W + x) > 8) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const PAD = 6;
const crop = { left: Math.max(0, minX - PAD), top: Math.max(0, minY - PAD), width: 0, height: 0 };
crop.width = Math.min(W, maxX + PAD + 1) - crop.left;
crop.height = Math.min(H, maxY + PAD + 1) - crop.top;
const master = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).extract(crop).png().toBuffer();
console.log(`source ${W}x${H}: removed ${dust} stray pixels, recoloured ${fringe} edge pixels, trimmed to ${crop.width}x${crop.height}`);

// ---------------------------------------------------------------- 2. the logo in two widths, WebP and PNG
const manifest = { source: { width: W, height: H }, logo: { width: crop.width, height: crop.height, sizes: {} }, icons: {}, og: { width: 1200, height: 630 } };
for (const w of [480, 960]) {
  const h = Math.round((crop.height * w) / crop.width);
  const base = sharp(master).resize({ width: w, height: h, kernel: "lanczos3" });
  const webp = await base.clone().webp({ quality: 90, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
  const png = await base.clone().png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  writeFileSync(join(OUT, `arna-logo-${w}.webp`), webp);
  writeFileSync(join(OUT, `arna-logo-${w}.png`), png);
  manifest.logo.sizes[w] = { width: w, height: h, webpBytes: webp.length, pngBytes: png.length };
  console.log(`arna-logo-${w}: ${w}x${h}, webp ${(webp.length / 1024).toFixed(1)} KB, png ${(png.length / 1024).toFixed(1)} KB`);
}

// ---------------------------------------------------------------- 3. icons: the logo on a dark square
/** size: pixels; pad: free space on every side as a share of the size; round: corner radius as a share of the size (0 = full bleed) */
async function icon(name, size, { pad, round }) {
  const logoW = Math.round(size * (1 - 2 * pad));
  const logo = await sharp(master).resize({ width: logoW, kernel: "lanczos3" }).toBuffer();
  const lh = (await sharp(logo).metadata()).height;
  let img = sharp({ create: { width: size, height: size, channels: 4, background: TEAL } }).composite([
    { input: logo, left: Math.round((size - logoW) / 2), top: Math.round((size - lh) / 2) },
  ]);
  let buf = await img.png().toBuffer();
  if (round > 0) {
    const r = Math.round(size * round);
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);
    buf = await sharp(buf).composite([{ input: mask, blend: "dest-in" }]).png({ compressionLevel: 9 }).toBuffer();
  } else {
    buf = await sharp(buf).png({ compressionLevel: 9 }).toBuffer();
  }
  writeFileSync(join(OUT, name), buf);
  manifest.icons[name] = { size, bytes: buf.length };
  console.log(`${name}: ${size}x${size}, ${(buf.length / 1024).toFixed(1)} KB`);
}
await icon("favicon-32.png", 32, { pad: 0.1, round: 0.22 });
await icon("favicon-96.png", 96, { pad: 0.11, round: 0.22 });
await icon("apple-touch-icon.png", 180, { pad: 0.11, round: 0 }); // iOS rounds the corners itself
await icon("icon-192.png", 192, { pad: 0.11, round: 0.22 });
await icon("icon-512.png", 512, { pad: 0.11, round: 0.22 });
await icon("icon-maskable-512.png", 512, { pad: 0.2, round: 0 }); // 20% safe zone, full bleed

// ---------------------------------------------------------------- 4. social card (1200x630): the line is drawn into the picture
const fontCss = readFileSync(join(root, "apps", "web", "src", "app", "fonts.generated.css"), "utf8")
  .split("@font-face")
  .filter((b) => b.includes('"Commissioner"'))
  .map((b) => "@font-face" + b.replace(/url\((\/fonts\/[^)]+)\)/, (_, p) => `url(${pathToFileURL(join(root, "apps", "web", "public", p)).href})`))
  .join("\n");
const logoUrl = pathToFileURL(join(OUT, "arna-logo-960.png")).href;
const html = `<!doctype html><meta charset="utf-8"><style>
${fontCss}
html,body{margin:0;width:1200px;height:630px;background:${TEAL_DEEP}}
.og{width:1200px;height:630px;display:grid;place-items:center;background:radial-gradient(62% 72% at 50% 44%,#15525f 0%,${TEAL} 58%,${TEAL_DEEP} 100%)}
.in{display:flex;flex-direction:column;align-items:center}
img{display:block;width:720px;height:auto}
p{margin:36px 0 0;font:500 33px/1.3 "Commissioner",system-ui,sans-serif;letter-spacing:.05em;color:#cfdadd;text-align:center;white-space:nowrap}
</style><div class="og"><div class="in"><img src="${logoUrl}" alt=""><p>Шекарасыз әлем · Мир без границ · A world without borders</p></div></div>`;
const htmlFile = join(tmpdir(), "arna-og-card.html"); // a real file: a page set with setContent may not read file:// pictures and fonts
writeFileSync(htmlFile, html);
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlFile).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const shot = await page.screenshot({ type: "png" });
await browser.close();
const og = await sharp(shot).png({ palette: true, quality: 92, compressionLevel: 9, effort: 8 }).toBuffer();
writeFileSync(join(root, "apps", "web", "public", "og.png"), og);
manifest.og.bytes = og.length;
console.log(`og.png: 1200x630, ${(og.length / 1024).toFixed(1)} KB`);

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log("brand.manifest.json written");
