import manifest from "./demo-audio.json";
import { withBase } from "./site";

/** One generated voice file: its size and its length (constant bitrate, so size gives the length). */
export type AudioLine = { n: number; bytes: number; seconds: number };

// demo-audio.json is written by scripts/gen-demo-audio.mjs: { _meta, <lang>: AudioLine[] }. It is {} until audio is generated.
const files = manifest as unknown as Record<string, AudioLine[] | unknown>;

/** The generated voice lines of a language (apps/web/public/audio/demo/<lang>/<n>.mp3), or null when there are none. */
export function audioLines(lang: string): AudioLine[] | null {
  const l = files[lang];
  return Array.isArray(l) && l.length ? (l as AudioLine[]) : null;
}

/** URL of line `n` (1-based) of a language. */
export const audioUrl = (lang: string, n: number) => withBase(`/audio/demo/${lang}/${n}.mp3`);
