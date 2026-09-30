// Functional QA of the scripted demo, the pilot form, the WhatsApp button, theme and language detection.
// Usage: node scripts/qa-demo.mjs [baseUrl=http://localhost:3000]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv.find((a) => a.startsWith("http")) || "http://localhost:3000").replace(/\/$/, "");
const dict = (l) => JSON.parse(readFileSync(join(root, "packages", "i18n", `${l}.json`), "utf8"));
const script = JSON.parse(readFileSync(join(root, "content", "demo-script.json"), "utf8")).scripts;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "  ok " : "  FAIL"} ${msg}`);
};

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

async function newPhone(lang, opts = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  if (opts.languages) await page.evaluateOnNewDocument((l) => Object.defineProperty(navigator, "languages", { get: () => l }), opts.languages);
  await page.goto(`${base}${lang ? `/${lang}/` : "/"}`, { waitUntil: "networkidle0" });
  if (lang) await page.waitForFunction(() => Object.keys(document.querySelector("form") || document.body).some((k) => k.startsWith("__react")) || document.querySelector(".burger")?.hasAttribute("aria-expanded"), { timeout: 15000 }).catch(() => {});
  await sleep(1200);
  return { page, errors };
}
const step = (page) => page.$eval(".phone", (p) => p.dataset.step);
const READY = { voice: ".phone .btn-primary", live: ".transcript", summary: ".summary-card li", lang: ".phone-lang" };
const waitStep = async (page, s, ms = 40000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await step(page)) === s) {
      // the step content swaps in after a short exit animation
      await page.waitForSelector(READY[s], { timeout: 4000 }).catch(() => {});
      return true;
    }
    await sleep(250);
  }
  return false;
};

/* ------------------------------------------------ 1. full demo: ru page, Japanese listener */
console.log("Demo flow (ru page, listener language ja)");
{
  const d = dict("ru");
  const { page, errors } = await newPhone("ru");
  await page.evaluate(() => document.querySelector("#demo").scrollIntoView());
  await sleep(700);
  ok((await step(page)) === "lang", "starts on the language screen");
  ok((await page.$$(".phone-lang")).length === 10, "ten languages to choose from");
  ok(await page.$eval(".phone-badge", (b) => b.textContent.includes("Демо по сценарию")), "D-09 scripted badge visible");
  await page.click('.phone-lang[lang="ja"]');
  ok(await waitStep(page, "voice", 3000), "D-01 moves on automatically after choosing");
  const confirmDisabled = await page.$eval(".phone .btn-primary", (b) => b.disabled);
  ok(confirmDisabled, "D-02 confirm is disabled while the voice is being analysed");
  await sleep(2900);
  ok(await page.$eval(".phone .btn-primary", (b) => !b.disabled), "D-02 confirm enabled after the voice is recognised");
  await page.click(".phone .btn-primary");
  ok(await waitStep(page, "live", 3000), "D-02 confirming opens the listening screen");
  await sleep(4500);
  const typed = await page.$eval(".transcript", (t) => t.innerText);
  ok(/[぀-ヿ一-龯]/.test(typed), "D-03 Japanese translation is typing");
  ok(/[Ѐ-ӿ]/.test(typed), "D-03 Kazakh original is shown next to it");
  ok(await page.evaluate(() => [...document.fonts].some((f) => f.family.includes("Noto Sans JP") && f.status === "loaded")), "I-04 Japanese font subset was loaded on demand");
  // D-04 toggles
  const [audioBtn, subsBtn, bgBtn] = await page.$$(".ctl");
  ok((await page.$(".audio-block")) !== null, "audio block visible");
  await audioBtn.click();
  await sleep(200);
  ok((await page.$(".audio-block")) === null, "D-04 audio off hides the audio block");
  await audioBtn.click();
  await subsBtn.click();
  await sleep(200);
  ok(await page.$eval(".transcript", (t) => t.dataset.hidden === "true" && t.children.length === 0), "D-04 subtitles off hides the transcript");
  await subsBtn.click();
  // D-05 background mode
  await bgBtn.click();
  await sleep(500);
  ok(await page.$eval(".dim-overlay", (o) => o.dataset.open === "true" && getComputedStyle(o).visibility === "visible"), "D-05 background mode dims the screen");
  ok(await page.$eval(".dim-overlay", (o) => o.textContent.includes("Аудио продолжается")), "D-05 shows the audio-continues label");
  await page.screenshot({ path: join(root, "..", "temporary screenshots", "demo-dim.png") });
  await page.click(".dim-overlay");
  await sleep(500);
  ok(await page.$eval(".dim-overlay", (o) => o.dataset.open === "false"), "D-05 tapping again restores the screen");
  await page.screenshot({ path: join(root, "..", "temporary screenshots", "demo-live-ja.png") });
  ok(await waitStep(page, "summary", 45000), "D-06 session ends with the summary card");
  const items = await page.$$eval(".summary-card li", (l) => l.map((x) => x.textContent.trim()));
  ok(items.length === 3 && items.every((t, i) => t === script.ja.summary[i]), "D-06 three points match the prepared Japanese summary");
  await sleep(900);
  await page.screenshot({ path: join(root, "..", "temporary screenshots", "demo-summary-ja.png") });
  await page.click(".phone .btn-primary");
  ok(await waitStep(page, "lang", 3000), "D-07 restart returns to the first step");
  ok(errors.length === 0, `no console errors${errors.length ? `: ${errors[0]}` : ""}`);
  await page.close();
}

/* ------------------------------------------------ 2. same language + RTL target */
console.log("Demo edge cases");
{
  const { page } = await newPhone("kk");
  await page.evaluate(() => document.querySelector("#demo").scrollIntoView());
  await sleep(500);
  await page.click('.phone-lang[lang="kk"]');
  await waitStep(page, "voice", 3000);
  await sleep(2900);
  await page.click(".phone .btn-primary");
  await waitStep(page, "live", 3000);
  await sleep(1500);
  ok((await page.$$(".pair .orig")).length === 0, "kk speaker + kk listener: no duplicate original lane");
  ok(await page.$eval(".phone", (p, t) => p.textContent.includes(t), dict("kk").demo.live.sameLang), "kk speaker + kk listener: explains that no translation is needed");
  await page.close();
}
{
  const { page } = await newPhone("en");
  await page.evaluate(() => document.querySelector("#demo").scrollIntoView());
  await sleep(500);
  await page.click('.phone-lang[lang="ar"]');
  await waitStep(page, "voice", 3000);
  await sleep(2900);
  await page.click(".phone .btn-primary");
  await waitStep(page, "live", 3000);
  await sleep(4500);
  ok(await page.$eval(".pair .trans", (t) => t.dir === "rtl" && t.lang === "ar" && t.dataset.font === "arabic"), "Arabic translation lane is RTL with the Arabic font stack");
  await page.screenshot({ path: join(root, "..", "temporary screenshots", "demo-live-ar-on-en.png") });
  await page.close();
}

/* ------------------------------------------------ 3. pilot form */
console.log("Pilot form");
{
  const { page, errors } = await newPhone("en");
  await page.evaluateOnNewDocument(() => {});
  await page.evaluate(() => {
    window.__opened = [];
    window.open = (u) => (window.__opened.push(u), null);
  });
  await page.evaluate(() => document.querySelector("#pilot").scrollIntoView());
  await sleep(600);
  await page.click('form button[type="submit"]');
  await sleep(300);
  ok((await page.$$('form [role="alert"]')).length === 3, "C-01 empty submit shows three required-field errors");
  ok(await page.evaluate(() => document.activeElement?.name === "name"), "C-01 focus moves to the first invalid field");
  await page.type('input[name="name"]', "Aigerim Sadykova");
  await page.type('input[name="contact"]', "+7 701 555 12 34");
  await page.select('select[name="type"]', "forum");
  await page.click('form button[type="submit"]');
  await sleep(800);
  const opened = await page.evaluate(() => window.__opened);
  ok(opened.length === 1 && opened[0].startsWith("https://wa.me/77471673817?text="), "C-02 WhatsApp draft opens for +7 747 167 3817");
  const msg = decodeURIComponent((opened[0] || "").split("text=")[1] || "");
  ok(msg.includes("Aigerim Sadykova") && msg.includes("+7 701 555 12 34") && msg.includes("Forum or conference") && msg.includes("(en)"), "C-02 draft contains name, contact, event type and site language");
  ok(await page.$eval('[role="status"]', (s) => s.textContent.includes("Request is ready")), "C-03 confirmation is shown");
  const saved = await page.evaluate(() => localStorage.getItem("arna-last-lead"));
  ok(saved && JSON.parse(saved).name === "Aigerim Sadykova", "lead is also kept in localStorage (nothing lost)");
  await page.screenshot({ path: join(root, "..", "temporary screenshots", "form-success.png") });
  ok(errors.length === 0, "no console errors on the form");
  await page.close();
}

/* ------------------------------------------------ 4. WhatsApp floating button */
console.log("WhatsApp button");
for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${base}/kk/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => scrollTo(0, 1800));
  await sleep(400);
  const fab = await page.evaluate(() => {
    const b = document.querySelector(".wa-fab__btn");
    const r = b.getBoundingClientRect();
    const ring = getComputedStyle(document.querySelector(".wa-fab__ring"));
    const wrap = getComputedStyle(document.querySelector(".wa-fab"));
    return { href: b.href, right: innerWidth - r.right, bottom: innerHeight - r.bottom, w: r.width, pos: wrap.position, ringAnim: ring.animationName, btnAnim: getComputedStyle(b).animationName, label: b.getAttribute("aria-label") };
  });
  ok(fab.href.startsWith("https://wa.me/77471673817"), `${w}px: links to WhatsApp +7 747 167 3817`);
  ok(fab.pos === "fixed" && fab.right > 8 && fab.right < 50 && fab.bottom > 8 && fab.bottom < 50, `${w}px: pinned bottom-right (${Math.round(fab.right)}px, ${Math.round(fab.bottom)}px)`);
  ok(fab.ringAnim === "wa-ring" && fab.btnAnim === "wa-buzz", `${w}px: wave rings and buzz animations are running`);
  ok(fab.label === dict("kk").whatsapp.label, `${w}px: accessible label is localized`);
  await page.close();
}

/* ------------------------------------------------ 5. theme + language detection */
console.log("Theme and language detection");
{
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${base}/ru/`, { waitUntil: "networkidle0" });
  ok((await page.evaluate(() => document.documentElement.dataset.theme)) === "dark", "L-08 follows a dark system preference");
  await page.click("header .icon-btn:not(.burger)");
  ok((await page.evaluate(() => document.documentElement.dataset.theme)) === "light", "theme toggle switches to light");
  await page.reload({ waitUntil: "networkidle0" });
  ok((await page.evaluate(() => document.documentElement.dataset.theme)) === "light", "chosen theme survives a reload (no flash, saved)");
  await page.screenshot({ path: join(root, "..", "temporary screenshots", "light-desk-ru.png") });
  await page.close();
}
for (const [langs, expect, label] of [[["ko-KR", "en"], "/ko/", "browser language ko-KR"], [["ar-SA"], "/ar/", "browser language ar-SA"], [["de-DE"], "/ru/", "unsupported browser language falls back to Russian"], [["kk"], "/kk/", "browser language kk"]]) {
  const { page } = await newPhone(null, { languages: langs });
  await sleep(800);
  ok(new URL(page.url()).pathname === expect, `I-02 ${label} -> ${expect}`);
  await page.close();
}
{
  const { page } = await newPhone(null, { languages: ["en-US"] });
  await page.evaluate(() => localStorage.setItem("arna-lang", "uz"));
  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  await sleep(600);
  ok(new URL(page.url()).pathname === "/uz/", "I-02 a saved manual choice beats the browser language");
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`\nDEMO QA FAILED (${failures.length}):\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("\nDEMO QA PASSED");
