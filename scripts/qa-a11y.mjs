// Accessibility scan with axe-core (WCAG 2 A/AA) on the main pages, both themes.
// Usage: node scripts/qa-a11y.mjs [baseUrl] [--locales=ru,kk,ar]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const base = (process.argv.find((a) => a.startsWith("http")) || "http://localhost:3000").replace(/\/$/, "");
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const locales = (arg("locales") || "ru,kk,en,ar").split(",");

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
let total = 0;
for (const lang of locales) {
  for (const [theme, w, h, mobile] of [["dark", 1440, 900, false], ["light", 1440, 900, false], ["dark", 390, 844, true], ["light", 390, 844, true]]) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
    await page.goto(`${base}/${lang}/`, { waitUntil: "networkidle2", timeout: 90000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); }
      scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate(axeSource);
    const res = await page.evaluate(() =>
      axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] }, resultTypes: ["violations"] }),
    );
    for (const v of res.violations) {
      total++;
      console.log(`${lang} ${theme} ${w}px  [${v.impact}] ${v.id}: ${v.help}`);
      for (const n of v.nodes.slice(0, 3)) console.log(`     ${n.target.join(" ")}  ${(n.failureSummary || "").split("\n")[1] || ""}`);
    }
    await page.close();
  }
}
await browser.close();
console.log(total ? `\n${total} axe violations` : "\nAXE PASSED: no WCAG 2 A/AA violations");
process.exit(total ? 1 : 0);
