// Functional QA of the scripted demo, the pilot form, the WhatsApp button, theme and language detection.
// Usage: node scripts/qa-demo.mjs [baseUrl=http://localhost:3000]
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "..", "temporary screenshots"), { recursive: true }); // the run saves its screenshots next to the repo
const base = (process.argv.find((a) => a.startsWith("http")) || "http://localhost:3000").replace(/\/$/, "");
const dict = (l) => JSON.parse(readFileSync(join(root, "packages", "i18n", `${l}.json`), "utf8"));
const script = JSON.parse(readFileSync(join(root, "content", "demo-script.json"), "utf8")).scripts;
const bp = new URL(base).pathname.replace(/\/$/, "");
const ROOT = process.env.ROOT_VIEW === "demo" ? "demo/" : ""; // where "/" leads on this build
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "  ok " : "  FAIL"} ${msg}`);
};

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

// fake audio engine: records which voice files start playing and every pause (nothing is really played in the test)
const fakeAudio = () => {
  window.__sizes = new Map();
  const create = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (blob) => {
    const u = create(blob);
    window.__sizes.set(u, blob.size);
    return u;
  };
  window.__plays = [];
  window.__pauses = 0;
  HTMLMediaElement.prototype.play = function () {
    window.__plays.push({ size: window.__sizes.get(this.src) ?? 0 });
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function () {
    window.__pauses++;
  };
};
// generated voice files are served as they are; while some are still missing a small stub stands in for them
const audioDir = join(root, "apps", "web", "public", "audio", "demo");
const stubAudio = (page, fetched, mode) => {
  page.on("request", (r) => {
    const m = /\/audio\/demo\/([a-z]{2})\/(\d)\.mp3/.exec(r.url());
    if (!m) return r.continue();
    fetched.push(`${m[1]}/${m[2]}`);
    if (mode === "fail") return r.respond({ status: 404, body: "not found" });
    if (existsSync(join(audioDir, m[1], `${m[2]}.mp3`))) return r.continue();
    return r.respond({ status: 200, contentType: "audio/mpeg", body: Buffer.alloc(4096, 1) });
  });
};
const manifest = JSON.parse(readFileSync(join(root, "apps", "web", "src", "lib", "demo-audio.json"), "utf8"));
const haveVoice = Array.isArray(manifest.ja) && manifest.ja.length === 5;
if (!haveVoice) console.log("  SKIP  voice tests: no generated audio for ja in demo-audio.json (run scripts/gen-demo-audio.mjs)");

async function newPhone(lang, opts = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.setRequestInterception(true);
  stubAudio(page, [], "ok");
  await page.evaluateOnNewDocument(fakeAudio);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  if (opts.languages) await page.evaluateOnNewDocument((l) => Object.defineProperty(navigator, "languages", { get: () => l }), opts.languages);
  await page.goto(`${base}${lang ? `/${lang}/` : "/"}`, { waitUntil: "networkidle0" });
  if (lang) await page.waitForFunction(() => Object.keys(document.querySelector("form") || document.body).some((k) => k.startsWith("__react")) || document.querySelector(".burger")?.hasAttribute("aria-expanded"), { timeout: 15000 }).catch(() => {});
  await sleep(1200);
  return { page, errors };
}
const step = (page) => page.$eval(".phone", (p) => p.dataset.step);
const READY = { voice: ".voice-card", live: ".transcript", summary: ".summary-card li", lang: ".phone-lang" };
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
  await sleep(100);
  ok(await page.$eval(".phone", (p) => p.lang === "ja" && p.dir === "ltr" && p.dataset.font === "cjk-jp"), "picking a language sets lang, dir and data-font of the phone at once");
  ok(await page.$eval(".phone-badge", (b, t) => b.textContent.includes(t), dict("ja").demo.badge), "the phone text switches to the picked language at once (site section too)");
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
  ok(await page.$eval(".dim-overlay", (o, t) => o.textContent.includes(t), dict("ja").demo.background.title), "D-05 shows the audio-continues label in the listener's language");
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
  ok(await page.$eval(".phone", (p, t) => !p.hasAttribute("lang") && p.querySelector(".phone-badge").textContent.includes(t), "Демо по сценарию"), "D-07 restart puts the phone back into the page language");
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
  ok(await page.$eval(".phone", (p) => p.dir === "rtl" && p.lang === "ar" && p.dataset.font === "arabic"), "Arabic listener on an English page: the phone itself is right-to-left");
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
  await page.evaluate(() => document.querySelector("#pilot").scrollIntoView({ behavior: "instant" }));
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
  ok(new URL(page.url()).pathname === `${bp}${expect}${ROOT}`, `I-02 ${label} -> ${bp}${expect}${ROOT}`);
  await page.close();
}
{
  const { page } = await newPhone(null, { languages: ["en-US"] });
  await page.evaluate(() => localStorage.setItem("arna-lang", "uz"));
  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  await sleep(600);
  ok(new URL(page.url()).pathname === `${bp}/uz/${ROOT}`, "I-02 a saved manual choice beats the browser language");
  await page.close();
}

/* ------------------------------------------------ 6. standalone demo app (/<lang>/demo/) */
console.log("Standalone demo app");
{
  const page = await browser.newPage();
  const fetched = [];
  await page.setRequestInterception(true);
  stubAudio(page, fetched, "ok");
  await page.evaluateOnNewDocument(fakeAudio);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${base}/ru/demo/`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".phone-lang");
  await sleep(1200);
  const s0 = await page.evaluate(() => ({
    screenH: Math.round(document.querySelector(".phone__screen").getBoundingClientRect().height),
    innerH: innerHeight,
    docH: document.documentElement.scrollHeight,
    scrollW: document.documentElement.scrollWidth,
    frame: getComputedStyle(document.querySelector(".phone__bezel")).paddingTop,
    qr: !!document.querySelector(".qr svg"),
    sideShown: getComputedStyle(document.querySelector(".demo-app__side")).display !== "none",
  }));
  ok(s0.screenH === s0.innerH && s0.docH <= s0.innerH + 1, `phone: the demo fills the whole screen (${s0.screenH}px of ${s0.innerH}px) without page scroll`);
  ok(s0.scrollW <= 390 && s0.frame === "0px", "phone: no sideways scroll and no frame around the screen");
  ok(!s0.sideShown, "phone: desktop side column is hidden");
  const startBtn = await page.$(".phone .btn-primary");
  ok(await page.evaluate((b) => b.disabled, startBtn), "start button is disabled until a language is chosen");
  ok((await page.$eval(".phone .btn-primary", (b) => b.textContent)) === "Демонстрация на примере сценария", "start button says «Демонстрация на примере сценария»");
  await page.click('.phone-lang[lang="ja"]');
  await sleep(500);
  if (haveVoice) ok(["1", "2", "3", "4", "5"].every((n) => fetched.includes(`ja/${n}`)), "ja voice files are preloaded as soon as the language is chosen");
  ok((await step(page)) === "lang", "picking a language does not move on by itself in app mode");
  ok((await page.$eval(".phone .btn-primary", (b) => !b.disabled && b.textContent)) === "シナリオ例によるデモ", "start button is enabled and speaks the chosen language");
  ok(await page.$eval(".phone-title", (t, x) => t.textContent === x, dict("ja").demo.lang.title), "the language step itself already speaks the chosen language");
  await page.click(".phone .btn-primary");
  ok(await waitStep(page, "voice", 4000), "start button opens the voice check");
  const ui = await page.evaluate(() => ({ lang: document.querySelector(".phone").lang, title: document.querySelector(".phone-title").textContent, badge: document.querySelector(".phone-badge").textContent }));
  ok(ui.lang === "ja" && ui.title === "この声は登壇者ですか？", "the whole UI switched to Japanese");
  ok(ui.badge.includes("シナリオ型デモ"), "scripted-demo badge is also in Japanese");
  await sleep(2900);
  await page.click(".phone .btn-primary");
  ok(await waitStep(page, "live", 4000), "confirming opens the live screen");
  await sleep(4000);
  if (haveVoice) {
    const lineStarts = () => page.evaluate(() => window.__plays.filter((p) => p.size > 1000).length);
    ok((await lineStarts()) >= 1, "the first translated line starts playing as audio");
    ok(await page.evaluate(() => !!navigator.mediaSession?.metadata?.title), "Media Session shows the running demo (lock screen and headset controls)");
    const [audioBtn, , bgBtn] = await page.$$(".ctl");
    const pausesA = await page.evaluate(() => window.__pauses);
    await bgBtn.click();
    await sleep(500);
    ok(await page.$eval(".dim-overlay", (o) => o.dataset.open === "true"), "background mode dims the screen");
    ok((await page.evaluate(() => window.__pauses)) === pausesA, "background mode keeps the audio playing (no pause)");
    await page.click(".dim-overlay");
    await sleep(400);
    const pausesB = await page.evaluate(() => window.__pauses);
    await audioBtn.click();
    await sleep(300);
    ok((await page.evaluate(() => window.__pauses)) > pausesB, "subtitles only: switching audio off stops the voice");
    const startsOff = await lineStarts();
    await sleep(4500);
    ok((await lineStarts()) === startsOff, "no new voice line while audio is off");
  }
  ok(await waitStep(page, "summary", 40000), "scenario ends with the summary");
  await page.close();
}
if (haveVoice) {
  // a voice file that fails to load never blocks the text: the line is still typed out
  const page = await browser.newPage();
  const fetched = [];
  await page.setRequestInterception(true);
  stubAudio(page, fetched, "fail");
  await page.evaluateOnNewDocument(fakeAudio);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${base}/ru/demo/`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".phone-lang");
  await sleep(800);
  await page.click('.phone-lang[lang="ja"]');
  await page.click(".phone .btn-primary");
  await waitStep(page, "voice", 4000);
  await sleep(2900);
  await page.click(".phone .btn-primary");
  await waitStep(page, "live", 4000);
  // the text keeps the pace of the (missing) voice, so the first translated characters come after the source line plus part of the audio length
  const typed = await page
    .waitForFunction(() => [...document.querySelectorAll(".pair .trans")].reduce((a, e) => a + e.textContent.length, 0) > 20, { timeout: 15000 })
    .then(() => true, () => false);
  ok(typed, "voice files unavailable: the translated text is still shown");
  ok((await page.evaluate(() => window.__plays.filter((p) => p.size > 1000).length)) === 0, "voice files unavailable: nothing is played and nothing breaks");
  await page.close();
}
{
  // Arabic: mirrored UI after starting; Kazakh listener has no voice here so it stays silent (no error)
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${base}/en/demo/`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".phone-lang");
  await sleep(1000);
  await page.click('.phone-lang[lang="ar"]');
  await page.click(".phone .btn-primary");
  await waitStep(page, "voice", 4000);
  const r = await page.evaluate(() => ({ dir: document.querySelector(".phone").dir, font: document.querySelector(".phone").dataset.font }));
  ok(r.dir === "rtl" && r.font === "arabic", "Arabic listener: the demo UI is right-to-left with the Arabic font stack");
  await page.close();
}
for (const lang of ["ru", "kk", "en", "zh", "uz", "ky", "ko", "ja", "hi", "ar"]) {
  for (const [w, h, mobile] of [[320, 568, true], [390, 844, true], [768, 1024, true], [1440, 900, false]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
    await page.goto(`${base}/${lang}/demo/`, { waitUntil: "networkidle0" });
    await sleep(500);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, dir: document.documentElement.dir, qr: !!document.querySelector(".qr svg"), langs: document.querySelectorAll(".phone-lang").length }));
    const bad = [];
    if (m.sw > m.iw) bad.push(`overflow ${m.sw}>${m.iw}`);
    if (m.langs !== 10) bad.push(`${m.langs} languages`);
    if (w >= 1024 && !m.qr) bad.push("no QR code");
    if (errors.length) bad.push(errors[0]);
    ok(bad.length === 0, `/${lang}/demo/ at ${w}px${bad.length ? `: ${bad.join("; ")}` : ""}`);
    await page.close();
  }
}

await browser.close();
if (failures.length) {
  console.error(`\nDEMO QA FAILED (${failures.length}):\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("\nDEMO QA PASSED");
