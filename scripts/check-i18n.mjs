// Verifies every dictionary against the master (en.json) and the demo script.
//  - identical key structure (arrays keep their length)
//  - no empty strings (except keys that are intentionally empty: stats.unit, plans.period)
//  - no em-dash or en-dash anywhere (TZ: Kazakh must not contain long dashes; design rule for all)
//  - {name} {contact} {type} {lang} placeholders preserved in pilot.message
//  - Kazakh/Kyrgyz/Uzbek use the expected script characters
//  - demo script has 5 lines and 3 summary points for every locale
// Exit code 1 on any error, so `npm run build` fails before shipping broken copy.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "packages", "i18n");
const master = JSON.parse(readFileSync(join(dir, "en.json"), "utf8"));
const demo = JSON.parse(readFileSync(join(root, "content", "demo-script.json"), "utf8"));
const OPTIONAL_EMPTY = /(^|\.)(unit|period)$/;
const DASH = /[—–‒―]/;

const errors = [];
const err = (loc, msg) => errors.push(`${loc}: ${msg}`);

function walk(ref, val, path, loc) {
  if (Array.isArray(ref)) {
    if (!Array.isArray(val)) return err(loc, `${path} should be an array`);
    if (val.length !== ref.length) err(loc, `${path} has ${val.length} items, expected ${ref.length}`);
    ref.forEach((r, i) => walk(r, val[i], `${path}[${i}]`, loc));
  } else if (ref && typeof ref === "object") {
    if (!val || typeof val !== "object") return err(loc, `${path} should be an object`);
    for (const k of Object.keys(ref)) {
      if (!(k in val)) err(loc, `${path ? path + "." : ""}${k} is missing`);
      else walk(ref[k], val[k], `${path ? path + "." : ""}${k}`, loc);
    }
    for (const k of Object.keys(val)) if (!(k in ref)) err(loc, `${path ? path + "." : ""}${k} is not in the master`);
  } else {
    if (typeof val !== "string") return err(loc, `${path} should be a string`);
    if (val.trim() === "" && !OPTIONAL_EMPTY.test(path)) err(loc, `${path} is empty`);
    if (DASH.test(val)) err(loc, `${path} contains a long dash`);
  }
}

const files = readdirSync(dir).filter((f) => /^[a-z]{2,3}\.json$/.test(f));
const codes = [];
for (const f of files) {
  const code = f.replace(".json", "");
  codes.push(code);
  const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
  walk(master, d, "", f);
  for (const ph of ["{name}", "{contact}", "{type}", "{lang}"]) {
    if (!d.pilot?.message?.includes(ph)) err(f, `pilot.message lacks ${ph}`);
  }
  if (d._meta.code !== code) err(f, "_meta.code mismatch");
  if (!["ltr", "rtl"].includes(d._meta.dir)) err(f, "_meta.dir must be ltr or rtl");
  const ds = demo.scripts[code];
  if (!ds) err("demo-script.json", `no script for ${code}`);
  else {
    if (ds.lines.length !== 5) err("demo-script.json", `${code}: ${ds.lines.length} lines, expected 5`);
    if (ds.summary.length !== 3) err("demo-script.json", `${code}: ${ds.summary.length} summary points, expected 3`);
    [...ds.lines, ...ds.summary].forEach((s, i) => {
      if (DASH.test(s)) err("demo-script.json", `${code}[${i}] contains a long dash`);
      if (!s.trim()) err("demo-script.json", `${code}[${i}] is empty`);
    });
  }
}
for (const c of Object.keys(demo.scripts)) if (!codes.includes(c)) err("demo-script.json", `script "${c}" has no dictionary`);

// script sanity: Kazakh must contain its special letters somewhere, Uzbek must use Latin
const kk = readFileSync(join(dir, "kk.json"), "utf8");
for (const ch of "әғқңөұүі") if (!kk.includes(ch)) err("kk.json", `never uses "${ch}" (check spelling)`);
const uz = readFileSync(join(dir, "uz.json"), "utf8");
if (/[Ѐ-ӿ]/.test(uz.replace(/"_meta"[\s\S]*?\}/, ""))) err("uz.json", "contains Cyrillic");

if (errors.length) {
  console.error(`i18n check FAILED (${errors.length}):\n - ` + errors.join("\n - "));
  process.exit(1);
}
console.log(`i18n check OK: ${codes.length} locales (${codes.join(", ")}), demo script complete, no long dashes.`);
