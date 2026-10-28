import script from "@content/demo-script.json";
import { getDictionary, localeList, type Locale } from "@arna/i18n";

export type DemoScript = Record<string, { lines: string[]; summary: string[] }>;

/** Source speaker language of the scripted demo (Kazakh, TZ 5.2). */
export const demoSource = script.source as Locale;
export const demoScripts = script.scripts as DemoScript;
/** Demo strings of every language: once a listener language is picked, the whole phone speaks it (site section and demo page). */
export const demoDicts = Object.fromEntries(localeList.map((l) => [l.code, getDictionary(l.code).demo]));
