// Functional QA of partner links (?ref=CODE): the language redirect keeps the query, one click request per code and session,
// a bad code sends nothing, a silent or failing service never breaks the site, the footer links to the privacy page.
// The real service is never called: the browser cannot resolve any host except localhost, every other request is blocked,
// and the click request (POST <APP_URL>/api/referral/click, plus its CORS preflight) is answered by this script.
// Usage: node scripts/qa-referral.mjs [baseUrl=http://localhost:3000]    (ROOT_VIEW=demo if "/" leads to the demo on this build)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv.find((a) => a.startsWith("http")) || "http://localhost:3000").replace(/\/$/, "");
const origin = new URL(base).origin;
const bp = new URL(base).pathname.replace(/\/$/, "");
const ROOT = process.env.ROOT_VIEW === "demo" ? "demo/" : ""; // where "/" leads on this build
const APP = (process.env.NEXT_PUBLIC_APP_URL || "https://app.arnavoice.com").replace(/\/$/, "");
const CLICK = new URL(`${APP}/api/referral/click`);
const LANGS = ["ru", "kk", "en", "zh", "uz", "ky", "ko", "ja", "hi", "ar"];
const dict = (l) => JSON.parse(readFileSync(join(root, "packages", "i18n", `${l}.json`), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "  ok " : "  FAIL"} ${msg}`);
};

// every name except localhost fails to resolve, so nothing can reach a real server even if a request slipped past the handler
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1"],
});
const escaped = []; // requests to other hosts that were blocked (anything but the click)

/** mode: ok (200), fail (connection error), error (HTTP 500), hang (never answered). `serve` = { url, html } fakes one own page. */
async function open(path, { mode = "ok", viewport = [390, 844, true], serve = null } = {}) {
  const page = await browser.newPage();
  const clicks = [];
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: viewport[0], height: viewport[1], isMobile: viewport[2], hasTouch: viewport[2] });
  await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] }));
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (serve && req.url() === serve.url) return req.respond({ status: 200, contentType: "text/html; charset=utf-8", body: serve.html });
    if (u.origin === origin || /^(data|blob|about):/.test(req.url())) return req.continue(); // own files and inline data: no network
    if (u.origin === CLICK.origin && u.pathname === CLICK.pathname) {
      const cors = {
        "access-control-allow-origin": origin,
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      };
      if (req.method() === "OPTIONS") return req.respond({ status: 204, headers: cors });
      clicks.push({ method: req.method(), body: JSON.parse(req.postData() || "null") });
      if (mode === "fail") return req.abort("failed");
      if (mode === "hang") return undefined;
      if (mode === "error") return req.respond({ status: 500, contentType: "application/json", headers: cors, body: '{"ok":false}' });
      return req.respond({ status: 200, contentType: "application/json", headers: cors, body: '{"ok":true}' });
    }
    escaped.push(`${req.method()} ${req.url()}`);
    return req.abort("blockedbyclient");
  });
  const t0 = Date.now();
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  return { page, clicks, errors, t0 };
}

/** waits until the page is a language page (/<lang>/...) and parsed; redirectMs is how long the redirect took */
async function landed(page, ms = 15000) {
  const t0 = Date.now();
  let redirectMs = -1;
  while (Date.now() - t0 < ms) {
    try {
      const p = new URL(page.url()).pathname.slice(bp.length);
      if (/^\/[a-z]{2}\//.test(p)) {
        if (redirectMs < 0) redirectMs = Date.now() - t0;
        if ((await page.evaluate(() => document.readyState)) !== "loading") return { ok: true, redirectMs };
      }
    } catch {
      /* the page is navigating */
    }
    await sleep(60);
  }
  return { ok: false, redirectMs };
}
const urlOf = (page) => {
  const u = new URL(page.url());
  return { path: u.pathname.slice(bp.length), search: u.search, hash: u.hash };
};
const stored = (page) => page.evaluate(() => sessionStorage.getItem("arna-ref-sent"));

// ------------------------------------------------ 1. the redirect keeps the query
console.log("Partner link through the language redirect");
for (const [from, to, hash] of [
  ["/?ref=TESTCODE1", `/en/${ROOT}`, ""],
  ["/?ref=TESTCODE1#pilot", `/en/${ROOT}`, "#pilot"],
  ["/demo/?ref=TESTCODE1", "/en/demo/", ""],
]) {
  const { page, clicks, errors } = await open(from);
  const got = await landed(page);
  const u = urlOf(page);
  ok(got.ok && u.path === to && u.search === "?ref=TESTCODE1" && u.hash === hash, `${from} -> ${to}?ref=TESTCODE1${hash} (got ${u.path}${u.search}${u.hash})`);
  await sleep(600);
  ok(clicks.length === 1 && clicks[0].method === "POST" && clicks[0].body?.code === "TESTCODE1", `${from}: exactly one click request, code TESTCODE1 (${clicks.length})`);
  ok(typeof clicks[0]?.body?.page === "string" && clicks[0].body.page.startsWith("/") && !clicks[0].body.page.includes("?"), `${from}: page is a path without the query (${clicks[0]?.body?.page})`);
  ok((await stored(page)) === "TESTCODE1", `${from}: the session remembers the code`);
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(400);
  ok(clicks.length === 1, `${from}: a reload does not repeat the request`);
  ok((await page.evaluate(() => document.cookie)) === "", `${from}: the site sets no cookie itself`);
  ok(errors.length === 0, `${from}: no script errors${errors.length ? `: ${errors[0]}` : ""}`);
  await page.close();
}
{
  const { page, clicks } = await open("/");
  await landed(page);
  const u = urlOf(page);
  ok(u.path === `/en/${ROOT}` && u.search === "" && clicks.length === 0, `"/" without ref redirects as before and sends nothing (${u.path}${u.search})`);
  await page.close();
}

// ------------------------------------------------ 2. one request per code and session
console.log("One request per code and session");
{
  const { page, clicks } = await open("/en/?ref=testcode1");
  await page.waitForNetworkIdle({ idleTime: 500 }).catch(() => {});
  ok(clicks.length === 1 && clicks[0].body.code === "TESTCODE1", `lower case is normalised to upper case (${clicks[0]?.body?.code})`);
  ok(clicks[0]?.body?.page === "/en/", `page is the path of the page (${clicks[0]?.body?.page})`);
  await page.goto(`${base}/en/?ref=TESTCODE1`, { waitUntil: "networkidle0" });
  ok(clicks.length === 1, "the same code again in the same session sends nothing");
  await page.goto(`${base}/en/?ref=OTHERCODE2`, { waitUntil: "networkidle0" });
  ok(clicks.length === 2 && clicks[1].body.code === "OTHERCODE2", "another code is a new click");
  await page.close();
}
for (const code of ["ABCD", "A1B2C3D4E5F6G7H8I9J0"]) {
  const { page, clicks } = await open(`/en/?ref=${code}`);
  await page.waitForNetworkIdle({ idleTime: 500 }).catch(() => {});
  ok(clicks.length === 1 && clicks[0].body.code === code, `${code.length} characters are accepted`);
  await page.close();
}

// ------------------------------------------------ 3. a bad code sends nothing
console.log("Invalid codes");
for (const [label, value] of [
  ["<script>", encodeURIComponent("<script>alert(1)</script>")],
  ["2 characters", "AB"],
  ["3 characters", "ABC"],
  ["21 characters", "A".repeat(21)],
  ["30 characters", "A".repeat(30)],
  ["a hyphen", "AB-CD-1234"],
  ["a space", "AB%20CD1234"],
  ["non-Latin letters", encodeURIComponent("ТЕСТКОД12")],
  ["empty", ""],
]) {
  const { page, clicks, errors } = await open(`/en/?ref=${value}`);
  await page.waitForNetworkIdle({ idleTime: 500 }).catch(() => {});
  ok(clicks.length === 0 && errors.length === 0, `${label}: no request, no error`);
  await page.close();
}
{
  const { page, clicks } = await open("/?ref=AB");
  await landed(page);
  ok(urlOf(page).search === "?ref=AB" && clicks.length === 0, `"/" with a bad code still passes the query on and sends nothing`);
  await page.close();
}

// ------------------------------------------------ 4. a silent or failing service never breaks the site
console.log("Service does not answer");
for (const [mode, label] of [["fail", "connection fails"], ["error", "answers HTTP 500"], ["hang", "never answers"]]) {
  const { page, clicks, errors } = await open("/?ref=TESTCODE1", { mode });
  const got = await landed(page);
  ok(got.ok && urlOf(page).search === "?ref=TESTCODE1", `${label}: "/" still opens the language page`);
  ok(got.redirectMs >= 0 && got.redirectMs < 2500, `${label}: the redirect waits for the service at most about a second (${got.redirectMs} ms)`);
  ok(await page.evaluate(() => !!document.querySelector("h1") && document.body.innerText.length > 500), `${label}: the page is shown`);
  ok(errors.length === 0, `${label}: no script errors${errors.length ? `: ${errors[0]}` : ""}`);
  if (mode !== "hang") ok((await stored(page)) === null, `${label}: the session does not remember a click that failed (a reload tries again)`);
  ok(clicks.length >= 1, `${label}: the request was made (${clicks.length})`);
  await page.close();
}
{
  // a language page itself never waits for the service
  const { page, t0 } = await open("/en/?ref=TESTCODE1", { mode: "hang" });
  await page.waitForSelector("h1", { timeout: 5000 });
  ok(Date.now() - t0 < 4000, `a language page does not wait for a silent service (${Date.now() - t0} ms)`);
  await page.close();
}

// ------------------------------------------------ 5. every language: no sideways scroll, footer link to the privacy page
console.log("Ten languages");
for (const lang of LANGS) {
  const { page, clicks, errors } = await open(`/${lang}/?ref=TESTCODE1`);
  await page.waitForNetworkIdle({ idleTime: 600 }).catch(() => {});
  const r = await page.evaluate(() => {
    const a = document.querySelector('footer a[href$="/privacy/"]');
    return { sw: document.documentElement.scrollWidth, iw: innerWidth, href: a?.href, text: a?.textContent.trim(), dir: document.documentElement.dir, cls: a?.className };
  });
  const want = dict(lang).footer.privacy;
  ok(r.sw <= r.iw, `/${lang}/ with ?ref at 390px: no sideways scroll (${r.sw} <= ${r.iw})`);
  ok(r.href === `${APP}/privacy/` && r.text === want, `/${lang}/: footer link "${want}" -> ${APP}/privacy/`);
  ok(clicks.length === 1 && errors.length === 0, `/${lang}/: one click, no script errors`);
  await page.close();
}
{
  const { page } = await open("/ar/", { viewport: [320, 568, true] });
  await page.waitForNetworkIdle({ idleTime: 600 }).catch(() => {});
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, dir: document.documentElement.dir }));
  ok(r.dir === "rtl" && r.sw <= r.iw, `/ar/ at 320px stays right to left without sideways scroll (${r.sw} <= ${r.iw})`);
  await page.close();
}

// ------------------------------------------------ 6. sub-path (GitHub Pages) is cut from `page`
console.log("Sub-path");
{
  const src = await (await fetch(`${base}/en/`)).text();
  const script = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes("__arnaRef") && s.includes("referral/click"));
  ok(!!script && script.includes(JSON.stringify(CLICK.href)), "the inline script is on the page and posts to the service address");
  if (script && script.includes('b=""')) {
    const fakeUrl = `${origin}/arna/en/?ref=TESTCODE1`;
    const html = `<!doctype html><meta charset="utf-8"><title>t</title><script>${script.replace('b=""', 'b="/arna"')}</script><p>page</p>`;
    const { page, clicks } = await open("/", { serve: { url: fakeUrl, html } }); // opens "/" first, then the fake page
    await page.goto(fakeUrl, { waitUntil: "networkidle0" });
    await sleep(300);
    const mine = clicks.filter((c) => c.body?.page === "/en/");
    ok(mine.length === 1, `under /arna the page field is /en/ (${clicks.map((c) => c.body?.page).join(", ")})`);
    await page.close();
  } else if (script) {
    console.log("  skip sub-path test: this build already has a base path");
  }
}

ok(escaped.length === 0, `nothing but the faked click request left the browser (${escaped.length} blocked${escaped[0] ? `, e.g. ${escaped[0]}` : ""})`);
await browser.close();
if (failures.length) {
  console.error(`\nREFERRAL QA FAILED (${failures.length}):\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("\nREFERRAL QA PASSED");
