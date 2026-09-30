// Builds the self-hosted font set (TZ 3.1: one script system per font, only the needed files load).
//
//  * Onest (display) and Commissioner (body): full Latin + Cyrillic (+ext) so any user can type any text.
//    Both cover Kazakh ә ғ қ ң ө ұ ү һ і and Uzbek oʻ gʻ (verified by glyph map, see docs/fonts.md).
//  * Chinese / Japanese / Korean / Hindi / Arabic: Noto families, each cut down to exactly the characters
//    the site uses in that language (a few KB instead of several MB). Re-run this script after editing copy.
//  * "ARNA Names": tiny per-script subsets so the language switcher and the greeting chips show native
//    names correctly on every page without loading a whole CJK / Indic / Arabic font.
//
// Output: apps/web/public/fonts/*.woff2, apps/web/src/app/fonts.generated.css, apps/web/src/lib/fonts.manifest.json
// Needs network access to fonts.googleapis.com (run it when copy or fonts change; results are committed).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const i18nDir = join(root, "packages", "i18n");
const outDir = join(root, "apps", "web", "public", "fonts");
const cssOut = join(root, "apps", "web", "src", "app", "fonts.generated.css");
const manifestOut = join(root, "apps", "web", "src", "lib", "fonts.manifest.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(cssOut), { recursive: true });
mkdirSync(dirname(manifestOut), { recursive: true });
for (const f of readdirSync(outDir)) if (f.endsWith(".woff2")) rmSync(join(outDir, f));

// ---------------------------------------------------------------- helpers
const enc = (s) => encodeURIComponent(s).replace(/%20/g, "+");
async function getText(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 120)}`);
  return r.text();
}
async function getBin(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 120)}`);
  return Buffer.from(await r.arrayBuffer());
}
function parseBlocks(css) {
  const out = [];
  const re = /(?:\/\*\s*([\w-]+)\s*\*\/\s*)?@font-face\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const body = m[2];
    out.push({
      subset: m[1] || "text",
      weight: /font-weight:\s*([^;]+);/.exec(body)?.[1].trim() ?? "400",
      url: /url\(([^)]+)\)/.exec(body)?.[1],
      range: /unicode-range:\s*([^;]+);/.exec(body)?.[1].trim() ?? "",
    });
  }
  return out;
}
function rangeHas(range, cp) {
  return range.split(",").some((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, "").split("-");
    const lo = parseInt(a.replace(/\?/g, "0"), 16);
    const hi = b ? parseInt(b, 16) : a.includes("?") ? parseInt(a.replace(/\?/g, "f"), 16) : lo;
    return cp >= lo && cp <= hi;
  });
}
function strings(node, acc = []) {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => strings(n, acc));
  else if (node && typeof node === "object") Object.entries(node).forEach(([k, v]) => k !== "_comment" && strings(v, acc));
  return acc;
}
const uniqueChars = (text) => [...new Set([...text.replace(/[\n\r]/g, "")])].sort().join("");
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");

// ---------------------------------------------------------------- inputs
const demo = JSON.parse(readFileSync(join(root, "content", "demo-script.json"), "utf8"));
const locales = {};
for (const f of readdirSync(i18nDir).filter((x) => /^[a-z]{2,3}\.json$/.test(x))) {
  const d = JSON.parse(readFileSync(join(i18nDir, f), "utf8"));
  const code = f.replace(".json", "");
  const ds = demo.scripts[code];
  locales[code] = {
    meta: d._meta,
    text: [...strings(d), ...(ds ? [...ds.lines, ...ds.summary] : [])].join(""),
  };
}

const css = [];
const files = {}; // key -> public url
const save = async (name, url) => {
  const buf = await getBin(url);
  const hash = createHash("sha1").update(buf).digest("hex").slice(0, 8);
  const file = `${name}.${hash}.woff2`;
  writeFileSync(join(outDir, file), buf);
  return { url: `/fonts/${file}`, bytes: buf.length };
};
const face = (family, weight, url, range) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format("woff2");${range ? `unicode-range:${range};` : ""}}`;

// ---------------------------------------------------------------- 1. Latin + Cyrillic families
const FAMILIES = [
  { family: "Onest", slug: "onest", wght: "400..800" },
  { family: "Commissioner", slug: "commissioner", wght: "400..700" },
];
const KEEP = ["cyrillic-ext", "cyrillic", "latin-ext", "latin"];
const famSubsets = {};
for (const fam of FAMILIES) {
  const blocks = parseBlocks(await getText(`https://fonts.googleapis.com/css2?family=${enc(fam.family)}:wght@${fam.wght}&display=swap`));
  famSubsets[fam.slug] = [];
  for (const b of blocks.filter((x) => KEEP.includes(x.subset))) {
    const { url, bytes } = await save(`${fam.slug}-${b.subset}`, b.url);
    css.push(face(fam.family, b.weight, url, b.range));
    famSubsets[fam.slug].push({ subset: b.subset, url, range: b.range });
    console.log(`  ${fam.slug}-${b.subset}: ${(bytes / 1024).toFixed(1)} KB`);
  }
}

// ---------------------------------------------------------------- 2. script-specific text subsets
const SCRIPT_FONTS = {
  "cjk-sc": [{ family: "Noto Sans SC", wght: "400..800", role: "main" }],
  "cjk-jp": [{ family: "Noto Sans JP", wght: "400..800", role: "main" }],
  "cjk-kr": [{ family: "Noto Sans KR", wght: "400..800", role: "main" }],
  devanagari: [{ family: "Noto Sans Devanagari", wght: "400..800", role: "main" }],
  arabic: [
    { family: "Noto Sans Arabic", wght: "400..800", role: "main" },
    { family: "Noto Kufi Arabic", wght: "500..800", role: "display" },
  ],
};
async function textSubset(family, wght, text) {
  const css2 = await getText(`https://fonts.googleapis.com/css2?family=${enc(family)}:wght@${wght}&display=swap&text=${enc(text)}`);
  const b = parseBlocks(css2)[0];
  if (!b?.url) throw new Error(`no font returned for ${family}`);
  return b;
}

const manifest = { preload: {}, stacks: {} };
const namesRules = [];

for (const [code, { meta, text }] of Object.entries(locales)) {
  const defs = SCRIPT_FONTS[meta.font];
  manifest.preload[code] = [];
  if (defs) {
    const isCjk = meta.font.startsWith("cjk");
    const chars = uniqueChars(text + (isCjk ? ASCII : ""));
    for (const def of defs) {
      const b = await textSubset(def.family, def.wght, chars);
      const slug = `${def.family.toLowerCase().replace(/\s+/g, "-")}-${code}`;
      const { url, bytes } = await save(slug, b.url);
      css.push(face(def.family, b.weight, url, b.range));
      manifest.preload[code].push(url);
      console.log(`  ${slug}: ${chars.length} chars, ${(bytes / 1024).toFixed(1)} KB`);
    }
  }
}

// Latin/Cyrillic locales: preload only the Onest/Commissioner subsets whose range covers the copy
for (const [code, { meta, text }] of Object.entries(locales)) {
  if (SCRIPT_FONTS[meta.font]) {
    // Devanagari / Arabic keep Latin glyphs (ARNA, digits) in Onest
    if (!meta.font.startsWith("cjk")) {
      const s = famSubsets.onest.find((x) => x.subset === "latin");
      if (s) manifest.preload[code].push(s.url);
    }
    continue;
  }
  const cps = [...new Set([...text].map((c) => c.codePointAt(0)))].filter((cp) => cp > 32);
  for (const slug of ["onest", "commissioner"]) {
    for (const s of famSubsets[slug]) {
      const n = cps.filter((cp) => rangeHas(s.range, cp)).length;
      if (n > 0 && s.subset !== "latin-ext") manifest.preload[code].push(s.url);
    }
  }
}

// ---------------------------------------------------------------- 3. native names / greetings (all pages)
for (const [code, { meta }] of Object.entries(locales)) {
  const defs = SCRIPT_FONTS[meta.font];
  if (!defs) continue;
  const chars = uniqueChars(meta.nativeName + meta.welcome);
  const def = defs.find((d) => d.role === "main");
  const b = await textSubset(def.family, "500..800", chars);
  const family = `ARNA Names ${code}`;
  const { url, bytes } = await save(`names-${code}`, b.url);
  css.push(face(family, b.weight, url, b.range));
  namesRules.push(`[data-names="${code}"]{font-family:"${family}","${def.family}",sans-serif}`);
  console.log(`  names-${code}: ${chars.length} chars, ${(bytes / 1024).toFixed(1)} KB`);
}

writeFileSync(
  cssOut,
  `/* AUTO-GENERATED by scripts/build-fonts.mjs. Do not edit by hand. */\n${css.join("\n")}\n${namesRules.join("\n")}\n`,
);
manifest.preload = Object.fromEntries(Object.entries(manifest.preload).map(([k, v]) => [k, [...new Set(v)]]));
writeFileSync(manifestOut, JSON.stringify(manifest, null, 2) + "\n");
console.log(`fonts: ${readdirSync(outDir).length} files written to public/fonts`);
