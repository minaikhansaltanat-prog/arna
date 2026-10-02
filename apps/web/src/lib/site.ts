/** Contact details and URL helpers shared by header, footer, form and the floating WhatsApp button. */
export const PHONE_DISPLAY = "+7 747 167 3817";
export const PHONE_TEL = "+77471673817";
export const WHATSAPP_NUMBER = "77471673817";

export function waLink(text?: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/**
 * Optional "light lead collection" connector (TZ C-02): any endpoint that accepts a JSON POST
 * (Formspree, Web3Forms, a Google Apps Script web app, n8n webhook...). When empty, the form
 * prepares a WhatsApp message draft instead. No database is involved either way.
 */
export const LEAD_ENDPOINT = process.env.NEXT_PUBLIC_LEAD_ENDPOINT ?? "";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Sub-path the site is served from. GitHub Pages project sites live under /<repo>; Vercel and custom domains use "".
 * Set NEXT_PUBLIC_BASE_PATH=/arna for a GitHub Pages build (the workflow does this).
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
/** Root-relative URL for an own page or file, e.g. withBase("/ru/") */
export const withBase = (path: string) => `${BASE_PATH}${path}`;
/** Absolute URL for metadata, sitemap and structured data. */
export const absUrl = (path: string) => `${SITE_URL}${BASE_PATH}${path}`;

/** What "/" opens: the landing page ("site") or the standalone demo app ("demo", used on the VPS). */
export const ROOT_VIEW = process.env.NEXT_PUBLIC_ROOT_VIEW === "demo" ? "demo" : "site";

/** localStorage keys */
export const STORAGE = { lang: "arna-lang", theme: "arna-theme", lead: "arna-last-lead" } as const;

/** Section anchors, in page order. */
export const SECTIONS = { how: "how", demo: "demo", features: "features", cases: "cases", pricing: "pricing", pilot: "pilot" } as const;
