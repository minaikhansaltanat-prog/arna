import manifest from "./brand.manifest.json";
import { withBase } from "./site";

/**
 * Everything that refers to the logo picture lives here: file names, sizes and icon paths. When a designer delivers an SVG,
 * change this file (and scripts/build-brand.mjs); the components only use LOGO, ICONS and OG_IMAGE.
 * The files are made by `npm run brand` from content/brand/arna-logo-source.png.
 */
const dir = "/brand";
const big = manifest.logo.sizes["960"];
const small = manifest.logo.sizes["480"];

const at = (file: string) => withBase(`${dir}/${file}`);

export const LOGO = {
  /** what a screen reader says when the logo stands alone (the slogan is real text next to it) */
  alt: "ARNA",
  /** intrinsic size of the largest file: it gives the browser the proportions before the picture arrives (no layout shift) */
  width: big.width,
  height: big.height,
  /** width / height of the logo */
  aspect: manifest.logo.width / manifest.logo.height,
  webpSrcSet: `${at("arna-logo-480.webp")} ${small.width}w, ${at("arna-logo-960.webp")} ${big.width}w`,
  pngSrcSet: `${at("arna-logo-480.png")} ${small.width}w, ${at("arna-logo-960.png")} ${big.width}w`,
  png: at("arna-logo-480.png"),
  /** for <link rel="preload"> of the logo in the first screen */
  webp480: at("arna-logo-480.webp"),
} as const;

/** `sizes` of the hero logo: it is at most 420px wide (see .lockup[data-variant="hero"] in ui.css). */
export const HERO_LOGO_SIZES = "(min-width: 1024px) 420px, 46vw";

/** The logo on a dark rounded square: tab icon, home screen, lock screen. */
export const ICONS = {
  favicon32: at("favicon-32.png"),
  favicon96: at("favicon-96.png"),
  appleTouch: at("apple-touch-icon.png"),
  icon192: at("icon-192.png"),
  icon512: at("icon-512.png"),
  maskable512: at("icon-maskable-512.png"),
} as const;

/** Social card 1200x630 (the line under the logo is part of the picture). */
export const OG_IMAGE = { path: "/og.png", width: manifest.og.width, height: manifest.og.height } as const;

/** Title and description for og:title and the Twitter card: the slogan goes in, the page <title> itself is left as it is. */
export function socialText(lang: string, slogan: string, title: string, description: string) {
  const colon = title.startsWith("ARNA：") ? "：" : ": "; // Chinese and Japanese titles use the full-width colon
  const stop = lang === "zh" || lang === "ja" ? "。" : lang === "hi" ? "। " : ". ";
  return { title: `ARNA${colon}${slogan}`, description: `${slogan}${stop}${description}` };
}

/**
 * Approximate width of a slogan in em (weight 500, tracking 0.06em where it is used). The lockup uses it to size the slogan
 * so that it spans about 55 to 70% of the logo width in every language.
 */
export function sloganEm(text: string, font: string): number {
  const track = font === "latin" || font === "cyrillic" ? 0.06 : 0;
  let em = 0;
  for (const ch of [...text]) {
    if (ch === " ") em += 0.27 + track;
    else if (/[ᄀ-ᇿ぀-ヿ㐀-鿿가-힯]/.test(ch)) em += 1; // CJK, kana, hangul: one em each
    else if (/[؀-ۿ]/.test(ch)) em += 0.5; // Arabic: joined letters, narrow
    else if (/[ऀ-ॿ]/.test(ch)) em += 0.55; // Devanagari
    else em += 0.57 + track; // Latin and Cyrillic
  }
  return Math.round(em * 10) / 10;
}
