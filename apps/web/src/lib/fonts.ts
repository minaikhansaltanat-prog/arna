import manifest from "./fonts.manifest.json";

/** Font files a given locale needs right away (built by scripts/build-fonts.mjs). */
export function preloadFontsFor(code: string): string[] {
  return (manifest.preload as Record<string, string[]>)[code] ?? [];
}
