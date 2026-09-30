import script from "@content/demo-script.json";
import type { Locale } from "@arna/i18n";

export type DemoScript = Record<string, { lines: string[]; summary: string[] }>;

/** Source speaker language of the scripted demo (Kazakh, TZ 5.2). */
export const demoSource = script.source as Locale;
export const demoScripts = script.scripts as DemoScript;
