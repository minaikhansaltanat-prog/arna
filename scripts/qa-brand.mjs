// Brand QA: the logo and the slogan on every page and in every language.
//   node scripts/qa-brand.mjs [baseUrl=http://localhost:3000] [--shots=<folder>]      (npm run qa:brand)
// Checks per language (10) at a phone and a desktop size, dark and light:
//  - the slogan is the delivered text, a plain paragraph under the logo (not a heading), centred, sized by the rules
//    (about 5.5% of the logo width, at least 13px; gap about 4.5%; width 55 to 70%), tracking only for Latin and Cyrillic, RTL for Arabic
//  - contrast of the slogan against its background is 4.5:1 or better in both themes
//  - the header shows only the logo, the footer shows logo and slogan, the old emblem and the lone "ARNA" word are nowhere
//  - logo pictures are not lazy, have width and height and a srcset; layout shift stays near 0
//  - og:title, og:description and the Twitter card carry the slogan, <title> is untouched
//  - the first screen still holds the H1 and the main action on a small phone
//  - the 404 page shows logo and slogan
// With --shots the hero, the footer and the 404 page are saved as pictures (ar, zh, kk at 360 and 1440 px, dark and light).
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv.find((a) => a.startsWith("http")) || "http://localhost:3000").replace(/\/$/, "");
const shots = process.argv.find((a) => a.startsWith("--shots="))?.slice(8);
const bp = new URL(base).pathname.replace(/\/$/, "");
const LANGS = ["ru", "kk", "en", "zh", "uz", "ky", "ko", "ja", "hi", "ar"];
const dict = (l) => JSON.parse(readFileSync(join(root, "packages", "i18n", `${l}.json`), "utf8"));
const slogans = JSON.parse(readFileSync(join(root, "packages", "i18n", "slogan.json"), "utf8"));
// the slogans as delivered; they must never change without the owner (hi was added later: it only has to exist)
const DELIVERED = {
  kk: "Шекарасыз әлем", ru: "Мир без границ", en: "A world without borders", tr: "Sınırsız dünya", uz: "Chegarasiz dunyo",
  ky: "Чек арасыз дүйнө", zh: "没有边界的世界", ja: "国境のない世界", ko: "국경 없는 세상", ar: "عالم بلا حدود",
};
const NO_TRACKING = ["ar", "zh", "ja", "ko", "hi"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "  ok " : "  FAIL"} ${msg}`);
};
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const hex = (s) => {
  const h = s.trim().replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.length === 3 ? h[i / 2] + h[i / 2] : h.slice(i, i + 2), 16));
};

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
async function open(path, { w, h, theme = "dark", mobile = w < 800, reduced = false }) {
  const page = await browser.newPage();
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]); // pictures: motion settled, no smooth scrolling
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((t) => {
    try { localStorage.setItem("arna-theme", t); } catch {}
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  }, theme);
  const res = await page.goto(`${base}${path}`, { waitUntil: "networkidle0" });
  await sleep(900);
  return { page, status: res?.status() };
}

console.log("Slogan texts");
ok(LANGS.every((l) => typeof slogans[l] === "string" && slogans[l].trim()), "every site language has a slogan in slogan.json");
for (const [l, s] of Object.entries(DELIVERED)) ok(slogans[l] === s, `${l}: "${s}" is unchanged`);
ok(LANGS.every((l) => !new RegExp("[" + String.fromCharCode(0x2014, 0x2013) + "]").test(slogans[l])), "no long dash in any slogan");

for (const lang of LANGS) {
  console.log(`\n${lang}`);
  const d = dict(lang);
  const want = slogans[lang];
  for (const [w, h, theme] of [[390, 844, "dark"], [1440, 900, "light"]]) {
    const tag = `${lang} ${w}px ${theme}`;
    const { page } = await open(`/${lang}/`, { w, h, theme });
    const m = await page.evaluate(() => {
      const hero = document.querySelector(".hero .lockup");
      const img = hero?.querySelector("img");
      const p = hero?.querySelector(".lockup__slogan");
      const ir = img?.getBoundingClientRect();
      const pr = p?.getBoundingClientRect();
      const range = document.createRange();
      if (p) range.selectNodeContents(p);
      const tr = range.getBoundingClientRect();
      const cs = p && getComputedStyle(p);
      const foot = document.querySelector(".site-footer .lockup");
      const hdr = document.querySelector(".site-header .brand-link");
      const meta = (n) => document.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.getAttribute("content");
      const imgs = [...document.querySelectorAll("img")].filter((i) => /arna-logo/.test(i.currentSrc || i.src));
      return {
        hasHero: !!hero,
        slogan: p?.textContent.trim(),
        tag: p?.tagName,
        inHeading: !!p?.closest("h1,h2,h3,h4,h5,h6"),
        logoW: ir?.width, logoBottom: ir?.bottom, logoCx: ir && ir.left + ir.width / 2,
        pTop: pr?.top, textW: tr.width, textCx: tr.left + tr.width / 2,
        fs: cs && parseFloat(cs.fontSize), ls: cs?.letterSpacing, color: cs?.color, dir: cs?.direction, weight: cs?.fontWeight,
        bg: getComputedStyle(document.documentElement).getPropertyValue("--bg"),
        bg2: getComputedStyle(document.querySelector(".site-footer")).getPropertyValue("--bg-2"),
        footSlogan: foot?.querySelector(".lockup__slogan")?.textContent.trim(),
        footFs: foot && parseFloat(getComputedStyle(foot.querySelector(".lockup__slogan")).fontSize),
        footColor: foot && getComputedStyle(foot.querySelector(".lockup__slogan")).color,
        hdrImg: hdr?.querySelector("img")?.currentSrc,
        hdrText: hdr?.textContent.trim(),
        hdrSlogan: !!document.querySelector(".site-header .lockup__slogan"),
        h1: document.querySelectorAll("h1").length,
        title: document.title,
        ogTitle: meta("og:title"), ogDesc: meta("og:description"), twTitle: meta("twitter:title"), ogImage: meta("og:image"),
        lazy: imgs.some((i) => i.loading === "lazy"),
        sized: imgs.every((i) => i.getAttribute("width") && i.getAttribute("height") && i.getAttribute("srcset")),
        logoImgs: imgs.length,
        oldBrand: [...document.querySelectorAll("img,source,link,meta")].some((e) => /emblem|wordmark/i.test(e.outerHTML)),
        html: document.documentElement.outerHTML.includes("emblem") || document.documentElement.outerHTML.includes("wordmark"),
        cls: window.__cls,
      };
    });
    ok(m.hasHero && m.slogan === want, `${tag}: the hero shows the logo and the slogan "${want}"`);
    ok(m.tag === "P" && !m.inHeading && m.h1 === 1, `${tag}: the slogan is a plain paragraph, the page keeps one H1`);
    ok(Math.abs(m.textCx - m.logoCx) <= 2, `${tag}: the slogan is centred under the logo (${Math.round(m.textCx - m.logoCx)}px off)`);
    const gap = (m.pTop - m.logoBottom) / m.logoW;
    ok(m.pTop >= m.logoBottom - 1 && gap >= 0.035 && gap <= 0.055, `${tag}: gap under the logo is about 4.5% of its width (${(gap * 100).toFixed(1)}%)`);
    ok(m.fs >= 13 && m.fs / m.logoW >= 0.045 && m.fs / m.logoW <= 0.115, `${tag}: slogan size ${m.fs.toFixed(1)}px = ${((m.fs / m.logoW) * 100).toFixed(1)}% of the logo width (about 5.5% where the width rule allows it, 13px at least)`);
    const wr = m.textW / m.logoW;
    ok(wr >= 0.5 && wr <= 0.75, `${tag}: the slogan spans ${(wr * 100).toFixed(0)}% of the logo width (55 to 70%)`);
    const trackOff = m.ls === "normal" || parseFloat(m.ls) === 0;
    ok(NO_TRACKING.includes(lang) ? trackOff : Math.abs(parseFloat(m.ls) / m.fs - 0.06) < 0.005, `${tag}: letter-spacing ${m.ls} ${NO_TRACKING.includes(lang) ? "(none for this script)" : "(0.06em)"}`);
    ok(m.weight === "500", `${tag}: weight 500`);
    if (lang === "ar") ok(m.dir === "rtl", `${tag}: the Arabic slogan is right to left`);
    const heroBg = hex(m.bg);
    ok(contrast(rgb(m.color), heroBg) >= 4.5, `${tag}: slogan contrast on the page ${contrast(rgb(m.color), heroBg).toFixed(1)}:1`);
    ok(m.footSlogan === want && m.footFs >= 13, `${tag}: the footer shows logo and slogan (${m.footFs}px)`);
    ok(contrast(rgb(m.footColor), hex(m.bg2)) >= 4.5, `${tag}: footer slogan contrast ${contrast(rgb(m.footColor), hex(m.bg2)).toFixed(1)}:1`);
    ok(/arna-logo/.test(m.hdrImg || "") && !m.hdrSlogan && m.hdrText === "", `${tag}: the header shows only the logo, no "ARNA" word, no slogan`);
    ok(!m.oldBrand && !m.html, `${tag}: no old emblem or wordmark in the page`);
    ok(!m.lazy && m.sized && m.logoImgs >= 3, `${tag}: logo pictures are not lazy, have width, height and srcset (${m.logoImgs} of them)`);
    ok(m.cls < 0.02, `${tag}: layout shift ${m.cls.toFixed(4)}`);
    ok(m.ogTitle?.includes(want) && m.ogDesc?.includes(want) && m.twTitle?.includes(want), `${tag}: og:title, og:description and the Twitter title carry the slogan`);
    ok(m.title === d.meta.title, `${tag}: <title> is untouched`);
    ok(/\/og\.png$/.test(m.ogImage || ""), `${tag}: og:image is og.png`);
    await page.close();
  }
}

console.log("\nFirst screen on a small phone");
for (const lang of ["ru", "kk", "ar", "zh", "hi"]) {
  const { page } = await open(`/${lang}/`, { w: 360, h: 740 });
  const r = await page.evaluate(() => {
    const h1 = document.querySelector("h1").getBoundingClientRect();
    const cta = document.querySelector(".hero-cta .btn-primary").getBoundingClientRect();
    return { h1Bottom: h1.bottom, ctaTop: cta.top, ctaBottom: cta.bottom, ih: innerHeight };
  });
  ok(r.h1Bottom < r.ih && r.ctaBottom <= r.ih, `${lang} 360x740: H1 (bottom ${Math.round(r.h1Bottom)}) and the main action (bottom ${Math.round(r.ctaBottom)}) are on the first screen (${r.ih})`);
  await page.close();
}

console.log("\nIcons, manifest, 404");
{
  const mf = await (await fetch(`${base}/manifest.webmanifest`)).json();
  const srcs = mf.icons.map((i) => i.src);
  ok(srcs.length >= 3 && srcs.every((s) => !/emblem/.test(s)) && mf.icons.some((i) => i.purpose === "maskable"), `manifest icons: ${srcs.map((s) => s.split("/").pop()).join(", ")}`);
  for (const f of ["favicon-32.png", "favicon-96.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "arna-logo-480.webp", "arna-logo-960.webp", "arna-logo-480.png", "arna-logo-960.png"]) {
    const r = await fetch(`${base}/brand/${f}`);
    ok(r.status === 200, `/brand/${f} is served`);
  }
  const og = await fetch(`${base}/og.png`);
  ok(og.status === 200 && (await og.arrayBuffer()).byteLength > 5000, "/og.png is served");
  const html = await (await fetch(`${base}/ru/`)).text();
  ok(/"logo":"[^"]*icon-512\.png"/.test(html), "JSON-LD logo is the new icon");
  // the 404 page starts in Russian and follows the language the visitor saved, without a hydration error
  for (const l of LANGS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.evaluateOnNewDocument((code) => { try { localStorage.setItem("arna-lang", code); } catch {} }, l);
    const res = await page.goto(`${base}/${l}/this-page-does-not-exist/`, { waitUntil: "networkidle0" });
    await sleep(500);
    const r = await page.evaluate(() => {
      const shown = [...document.querySelectorAll(".lockup__slogan")].filter((p) => !p.hidden).map((p) => p.textContent.trim());
      return { logo: !!document.querySelector(".lockup img"), shown, lang: document.documentElement.lang, dir: document.documentElement.dir, code: document.querySelector(".brand-screen__code")?.textContent, href: document.querySelector(".brand-screen__home")?.getAttribute("href") };
    });
    ok(res.status() === 404 && r.logo && r.shown.length === 1 && r.shown[0] === slogans[l] && r.code === "404", `404 page with saved language ${l}: logo, "${r.shown.join("|")}", status ${res.status()}`);
    ok(r.dir === (l === "ar" ? "rtl" : "ltr") && r.href.endsWith(`/${l}/`) && errors.length === 0, `404 page ${l}: direction ${r.dir}, link home ${r.href}, no script errors${errors.length ? `: ${errors[0]}` : ""}`);
    await page.close();
  }
}

if (shots) {
  mkdirSync(shots, { recursive: true });
  for (const lang of ["ar", "zh", "kk"]) {
    for (const [w, h] of [[360, 740], [1440, 900]]) {
      for (const theme of ["dark", "light"]) {
        const { page } = await open(`/${lang}/`, { w, h, theme, reduced: true });
        await page.screenshot({ path: join(shots, `hero-${lang}-${w}-${theme}.png`) });
        await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
        await sleep(1000);
        await page.screenshot({ path: join(shots, `footer-${lang}-${w}-${theme}.png`) });
        await page.close();
        const nf = await open(`/${lang}/missing/`, { w, h, theme, reduced: true });
        await nf.page.screenshot({ path: join(shots, `404-${lang}-${w}-${theme}.png`) });
        await nf.page.close();
      }
    }
  }
  console.log(`screenshots saved in ${shots}`);
}

await browser.close();
if (failures.length) {
  console.error(`\nBRAND QA FAILED (${failures.length}):\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("\nBRAND QA PASSED");
