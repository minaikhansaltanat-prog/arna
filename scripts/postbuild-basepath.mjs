// After `next build`: when the site is served under a sub-path (GitHub Pages: /<repo>), the generated font CSS
// still points at /fonts/... (Next does not rewrite plain url() values). Prefix them with the base path.
// No-op when NEXT_PUBLIC_BASE_PATH is empty (Vercel, custom domain).
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
if (!base) {
  console.log("postbuild: no base path, nothing to rewrite");
  process.exit(0);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", "out", "_next", "static");
let files = 0;
let replaced = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
    } else if (name.endsWith(".css")) {
      const css = readFileSync(p, "utf8");
      const next = css.replace(/url\((["']?)\/fonts\//g, (_, q) => {
        replaced++;
        return `url(${q}${base}/fonts/`;
      });
      if (next !== css) {
        writeFileSync(p, next);
        files++;
      }
    }
  }
}

walk(out);
console.log(`postbuild: prefixed ${replaced} font URLs with "${base}" in ${files} CSS file(s)`);
