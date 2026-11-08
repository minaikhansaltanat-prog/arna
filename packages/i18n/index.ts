import { dictionaries, localeCodes } from "./registry.generated";
import slogans from "./slogan.json";
import type en from "./en.json";

export type Locale = (typeof localeCodes)[number];
export type Dictionary = typeof en;
export type LocaleMeta = Dictionary["_meta"] & { dir: "ltr" | "rtl" };

/** Fallback when nothing else matches (TZ section 3: Russian is the base language). */
export const defaultLocale: Locale = "ru";

export const locales = localeCodes as readonly Locale[];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] as Dictionary;
}

/** The brand slogan that sits under the logo, in the language of the page (packages/i18n/slogan.json). */
export function getSlogan(locale: Locale): string {
  return (slogans as Record<string, string>)[locale];
}

export function getMeta(locale: Locale): LocaleMeta {
  return getDictionary(locale)._meta as LocaleMeta;
}

/** Everything the language switcher needs, for every locale. */
export const localeList = locales.map((code) => {
  const m = getMeta(code);
  return { code, nativeName: m.nativeName, welcome: m.welcome, dir: m.dir, font: m.font, htmlLang: m.htmlLang };
});
export type LocaleListItem = (typeof localeList)[number];
