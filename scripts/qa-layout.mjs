// Automated layout QA (TZ section 8, scenarios 1, 2, 6 + the mobile requirements).
// Usage: node scripts/qa-layout.mjs [baseUrl=http://localhost:3000] [--quick]
// For every language and several screen sizes it checks:
//   - no horizontal overflow, and a sideways swipe / scrollTo cannot move the page
//   - the header is fixed and stays at top:0 after scrolling
//   - phones: burger on the far end, language button directly next to it, menu opens, burger becomes X, menu closes
//   - RTL for Arabic, lang/dir/data-font attributes
//   - no long dashes in visible text, no raw translation keys, no console/network errors
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv.find((a) => a.startsWith("http")) || "http://localhost:3000").replace(/\/$/, "");
const quick = process.argv.includes("--quick");
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const SIZE_ARG = arg("sizes");
const LOCALES = (arg("locales") || "ru,kk,en,zh,uz,ky,ko,ja,hi,ar").split(",");
const SIZES = SIZE_ARG ? SIZE_ARG.split(",").map((x) => x.split("x").map(Number)) : quick
  ? [[360, 740], [390, 844], [1024, 768], [1280, 800], [1440, 900]]
  : [[320, 640], [360, 740], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1366, 768], [1440, 900]];
const dict = (l) => JSON.parse(readFileSync(join(root, "packages", "i18n", `${l}.json`), "utf8"));

const failures = [];
const fail = (ctx, msg) => failures.push(`${ctx}: ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
let checks = 0;

for (const lang of LOCALES) {
  const d = dict(lang);
  for (const [w, h] of SIZES) {
    const ctx = `${lang} ${w}x${h}`;
    const mobile = w < 1280;
    const page = await browser.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("requestfailed", (r) => r.failure()?.errorText !== "net::ERR_ABORTED" && errors.push(`request failed: ${r.url()}`));
    page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w <= 768, hasTouch: w <= 768 });
    await page.goto(`${base}/${lang}/`, { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(500);

    // walk the page so every lazy block is laid out
    await page.evaluate(async () => {
      const step = Math.max(300, innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await sleep(400);

    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const hdr = document.querySelector(".site-header");
      const wide = [];
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > innerWidth + 1 || r.left < -1) {
          // ignore elements that are clipped by an ancestor
          let p = el.parentElement;
          let clipped = false;
          while (p && p !== document.body) {
            const cs = getComputedStyle(p);
            if (/(hidden|clip|auto|scroll)/.test(cs.overflowX)) {
              const pr = p.getBoundingClientRect();
              if (pr.right <= innerWidth + 1 && pr.left >= -1) {
                clipped = true;
                break;
              }
            }
            p = p.parentElement;
          }
          const cs = getComputedStyle(el);
          if (!clipped && cs.position !== "fixed") wide.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} [${Math.round(r.left)},${Math.round(r.right)}]`);
        }
      }
      return {
        scrollW: de.scrollWidth,
        bodyW: document.body.scrollWidth,
        innerW: innerWidth,
        headerTop: hdr ? Math.round(hdr.getBoundingClientRect().top) : null,
        headerPos: hdr ? getComputedStyle(hdr).position : null,
        scrollY: Math.round(scrollY),
        wide: wide.slice(0, 6),
        lang: de.lang,
        dir: de.dir,
        font: de.dataset.font,
        text: document.body.innerText,
        brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
      };
    });

    checks++;
    if (m.scrollW > m.innerW) fail(ctx, `document scrollWidth ${m.scrollW} > viewport ${m.innerW}`);
    if (m.bodyW > m.innerW) fail(ctx, `body scrollWidth ${m.bodyW} > viewport ${m.innerW}`);
    if (m.wide.length) fail(ctx, `elements outside the viewport: ${m.wide.join("; ")}`);
    if (m.scrollY < 100) fail(ctx, "page did not scroll");
    if (m.headerPos !== "fixed" || m.headerTop !== 0) fail(ctx, `header not pinned (position ${m.headerPos}, top ${m.headerTop})`);
    if (m.lang !== d._meta.htmlLang) fail(ctx, `html lang ${m.lang}, expected ${d._meta.htmlLang}`);
    if (m.dir !== d._meta.dir) fail(ctx, `html dir ${m.dir}, expected ${d._meta.dir}`);
    if (/[—–]/.test(m.text)) fail(ctx, "visible text contains a long dash");
    if (/\b(hero|nav|pilot|features)\.\w+/.test(m.text)) fail(ctx, "raw translation key visible");
    if (m.brokenImgs.length) fail(ctx, `broken images: ${m.brokenImgs.join(", ")}`);
    for (const e of errors) fail(ctx, `console/network: ${e}`);

    // sideways gestures must not move the page
    await page.evaluate(() => scrollTo(0, 600));
    await page.evaluate(() => scrollTo(300, 600));
    const sx = await page.evaluate(() => scrollX);
    if (sx !== 0) fail(ctx, `page scrolled sideways to ${sx}px`);
    if (w <= 768) {
      const cdp = await page.createCDPSession();
      await cdp.send("Input.synthesizeScrollGesture", { x: w / 2, y: h / 2, xDistance: -220, yDistance: 0, gestureSourceType: "touch" }).catch(() => {});
      await sleep(300);
      const sx2 = await page.evaluate(() => scrollX);
      if (sx2 !== 0) fail(ctx, `horizontal swipe moved the page to ${sx2}px`);
    }

    if (mobile) {
      await page.evaluate(() => scrollTo(0, 0));
      await sleep(250);
      const rtl = d._meta.dir === "rtl";
      const geo = await page.evaluate(() => {
        const b = document.querySelector(".burger");
        const l = document.querySelector(".lang-btn");
        const r = (el) => (el ? el.getBoundingClientRect() : null);
        const bb = r(b);
        const lb = r(l);
        return {
          burger: bb && { l: bb.left, r: bb.right, w: bb.width, h: bb.height, vis: getComputedStyle(b).display !== "none" },
          lang: lb && { l: lb.left, r: lb.right, h: lb.height },
          nav: getComputedStyle(document.querySelector("header nav")).display,
        };
      });
      if (!geo.burger?.vis) fail(ctx, "burger button is not visible on a phone");
      else {
        if (geo.burger.w < 44 || geo.burger.h < 44) fail(ctx, `burger touch target ${geo.burger.w}x${geo.burger.h} < 44`);
        if (!rtl && geo.burger.r < w - 40) fail(ctx, `burger is not at the top-right (right edge ${Math.round(geo.burger.r)} of ${w})`);
        if (rtl && geo.burger.l > 40) fail(ctx, `burger is not at the top-left in RTL (left edge ${Math.round(geo.burger.l)})`);
        if (!rtl && !(geo.lang.r <= geo.burger.l + 1)) fail(ctx, "language button is not to the left of the burger");
        if (rtl && !(geo.lang.l >= geo.burger.r - 1)) fail(ctx, "language button is not to the right of the burger in RTL");
        if (geo.nav !== "none") fail(ctx, "desktop nav visible on a phone");
      }
      // open / X / close
      await page.click(".burger");
      await sleep(800);
      const open = await page.evaluate(() => {
        const b = document.querySelector(".burger");
        const menu = document.querySelector("#mobile-menu");
        const mr = menu.getBoundingClientRect();
        const lines = [...b.querySelectorAll("i")].map((i) => getComputedStyle(i).transform);
        return {
          expanded: b.getAttribute("aria-expanded"),
          label: b.getAttribute("aria-label"),
          menuOpen: menu.dataset.open,
          cover: mr.width >= innerWidth - 1 && mr.height >= innerHeight - 1,
          htmlMenu: document.documentElement.dataset.menu,
          lines,
          links: [...menu.querySelectorAll(".menu-link")].filter((a) => a.getBoundingClientRect().width > 0).length,
          fab: getComputedStyle(document.querySelector(".wa-fab")).visibility,
          overflow: getComputedStyle(document.documentElement).overflow,
        };
      });
      if (open.expanded !== "true" || open.menuOpen !== "true") fail(ctx, "menu did not open");
      if (open.label !== d.a11y.menuClose) fail(ctx, `burger label while open is "${open.label}", expected "${d.a11y.menuClose}"`);
      if (!open.cover) fail(ctx, "open menu does not cover the screen");
      if (open.htmlMenu !== "open" || !/hidden|clip/.test(open.overflow)) fail(ctx, "page scroll is not locked while the menu is open");
      if (open.links < 5) fail(ctx, `only ${open.links} menu links visible`);
      if (open.lines[1] === "none" || !/matrix/.test(open.lines[0] || "")) fail(ctx, "burger did not morph into an X");
      await page.click(".burger");
      await sleep(700);
      const closed = await page.evaluate(() => document.querySelector("#mobile-menu").dataset.open);
      if (closed !== "false") fail(ctx, "menu did not close");
    }
    if (!mobile) {
      // desktop header: everything on one row, nothing overlapping, CTA on a single line
      const hd = await page.evaluate(() => {
        const r = (el) => el.getBoundingClientRect();
        const brand = r(document.querySelector(".brand-link"));
        const links = [...document.querySelectorAll("header nav .nav-link")].map(r);
        const cta = r(document.querySelector("header .btn-primary"));
        const langBtn = r(document.querySelector(".lang-btn"));
        const head = r(document.querySelector(".site-header"));
        const icons = [...document.querySelectorAll(".lang-btn svg")].map((s) => Math.round(r(s).width));
        return { brand, first: links[0], last: links[links.length - 1], cta, langBtn, head, rowH: Math.max(...links.map((l) => l.height)), icons };
      });
      const rtlD = d._meta.dir === "rtl";
      if (hd.cta.height > 56) fail(ctx, `header CTA wraps to several lines (height ${Math.round(hd.cta.height)})`);
      if (hd.rowH > 56) fail(ctx, "a nav link wraps to two lines");
      if (hd.head.height > 82) fail(ctx, `header is ${Math.round(hd.head.height)}px tall`);
      const gap = rtlD ? hd.brand.left - hd.last.right : hd.first.left - hd.brand.right;
      if (gap < 8) fail(ctx, `nav touches the logo (gap ${Math.round(gap)}px)`);
      const gap2 = rtlD ? hd.langBtn.left - hd.cta.right : hd.cta.left - hd.langBtn.right;
      if (gap2 < -1) fail(ctx, "language button overlaps the CTA");
      if (hd.icons.some((wd) => wd < 14)) fail(ctx, `language button icons are squeezed: ${hd.icons}`);
    }
    await page.close();
  }
  process.stdout.write(`${lang} done\n`);
}

// language switching via the UI keeps the page soft-navigating and updates dir/lang (TZ scenario 1 and 2)
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${base}/ru/`, { waitUntil: "networkidle0" });
  await page.click(".lang-btn");
  await sleep(500);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click('.lang-item[hreflang="ar"]')]);
  await sleep(600);
  const r = await page.evaluate(() => ({ dir: document.documentElement.dir, lang: document.documentElement.lang, path: location.pathname, h1: document.querySelector("h1")?.textContent }));
  checks++;
  if (r.dir !== "rtl" || r.lang !== "ar" || r.path !== "/ar/") fail("switch ru>ar", JSON.stringify(r));
  if (!r.h1?.includes(dict("ar").hero.title[0].slice(0, 6))) fail("switch ru>ar", `h1 not Arabic: ${r.h1}`);
  await page.click(".lang-btn");
  await sleep(500);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click('.lang-item[hreflang="kk"]')]);
  await sleep(600);
  const r2 = await page.evaluate(() => ({ dir: document.documentElement.dir, lang: document.documentElement.lang, path: location.pathname, font: document.documentElement.dataset.font }));
  if (r2.dir !== "ltr" || r2.lang !== "kk" || r2.font !== "cyrillic") fail("switch ar>kk", JSON.stringify(r2));
  await page.close();
}

await browser.close();
console.log(`\n${checks} page checks run`);
if (failures.length) {
  console.error(`QA FAILED (${failures.length}):\n - ` + failures.join("\n - "));
  process.exit(1);
}
console.log("QA PASSED: no horizontal overflow, header pinned, burger/menu correct, RTL ok, no dashes, no errors.");
