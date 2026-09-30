// Linux (GitHub Actions, Vercel) has a case-sensitive file system, Windows does not.
// This checks that every relative / alias import in the sources matches the real file name exactly.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps", "web");
const EXT = ["", ".ts", ".tsx", ".json", ".css", "/index.ts", "/index.tsx"];
const problems = [];

function exactExists(p) {
  // verify every path segment below the repo root with exact case
  const rel = p.slice(root.length + 1).split(/[\\/]/);
  let cur = root;
  for (const seg of rel) {
    if (!readdirSync(cur).includes(seg)) return false;
    cur = join(cur, seg);
  }
  return true;
}

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (["node_modules", ".next", "out"].includes(n)) continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : /\.(tsx?|mjs)$/.test(n) && out.push(p);
  }
  return out;
}

for (const file of [...walk(join(web, "src")), ...walk(join(root, "packages"))]) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
    const spec = m[1];
    let base;
    if (spec.startsWith(".")) base = resolve(dirname(file), spec);
    else if (spec.startsWith("@/")) base = join(web, "src", spec.slice(2));
    else if (spec.startsWith("@content/")) base = join(root, "content", spec.slice(9));
    else continue;
    const hit = EXT.map((e) => base + e).find((c) => existsSync(c) && statSync(c).isFile());
    if (!hit) problems.push(`${file.slice(root.length + 1)}: cannot resolve "${spec}"`);
    else if (!exactExists(hit)) problems.push(`${file.slice(root.length + 1)}: "${spec}" differs in letter case from the real file`);
  }
}
if (problems.length) {
  console.error("CASE CHECK FAILED:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log("case check OK: all imports match file names exactly (safe on Linux).");
