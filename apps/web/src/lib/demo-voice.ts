import { audioLines, audioUrl } from "./demo-audio";

/**
 * Plays the pre-recorded demo voice (HTML audio, replaces the browser's speechSynthesis).
 *  - One shared <audio> element: iOS and Safari unlock an element for a tap, so it is primed once on the confirm button
 *    and then every line reuses it. Background play and the Media Session belong to this one element.
 *  - A language's files are fetched as soon as it is chosen and kept as object URLs, so a line starts without a network wait.
 *  - A missing or broken file never breaks the demo: playLine() just returns false and the text goes on by itself.
 */
const urls = new Map<string, Promise<string | null>>(); // "<lang>/<n>" -> object URL, null while a file is unavailable
let el: HTMLAudioElement | null = null;
let silent = "";
let token = 0;

function element(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = "auto";
  }
  return el;
}

function lineUrl(lang: string, n: number): Promise<string | null> {
  const key = `${lang}/${n}`;
  let p = urls.get(key);
  if (!p) {
    p = fetch(audioUrl(lang, n))
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => URL.createObjectURL(b))
      .catch(() => {
        urls.delete(key); // allow a later retry
        return null;
      });
    urls.set(key, p);
  }
  return p;
}

/** Start downloading every voice line of a language (call it when the visitor picks the language). */
export function preloadVoice(lang: string) {
  for (const { n } of audioLines(lang) ?? []) void lineUrl(lang, n);
}

/** Must run inside a tap: plays a silent clip once so the element may play the real lines later. */
export function unlockVoice() {
  if (typeof Audio === "undefined") return;
  if (!silent) {
    // 50 ms of 8-bit mono PCM silence
    const n = 400;
    const b = new Uint8Array(44 + n).fill(0x80);
    const dv = new DataView(b.buffer);
    const tag = (o: number, s: string) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    tag(0, "RIFF");
    dv.setUint32(4, 36 + n, true);
    tag(8, "WAVEfmt ");
    dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true);
    dv.setUint16(22, 1, true);
    dv.setUint32(24, 8000, true);
    dv.setUint32(28, 8000, true);
    dv.setUint16(32, 1, true);
    dv.setUint16(34, 8, true);
    tag(36, "data");
    dv.setUint32(40, n, true);
    silent = URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  }
  const a = element();
  a.src = silent;
  a.play().then(() => a.pause()).catch(() => {});
}

/** Play line `n` (1-based) of a language from its start. Resolves false when there is no file or the browser refuses. */
export async function playLine(lang: string, n: number, onEnded?: () => void): Promise<boolean> {
  const mine = ++token;
  const url = await lineUrl(lang, n);
  if (!url || mine !== token) return false; // missing file, or stopped / replaced while it was loading
  const a = element();
  a.onended = onEnded ?? null;
  a.src = url;
  a.currentTime = 0;
  try {
    await a.play();
    return true;
  } catch {
    return false;
  }
}

export function stopVoice() {
  token++;
  if (el) {
    el.onended = null;
    el.pause();
  }
}

/** Lock-screen and headset controls for the playing demo (Media Session). Returns a function that clears them. */
export function bindSession(meta: { title: string; artist: string; artwork: string }, h: { onPlay: () => void; onPause: () => void }) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return () => {};
  const ms = navigator.mediaSession;
  try {
    ms.metadata = new MediaMetadata({
      title: meta.title,
      artist: meta.artist,
      album: "ARNA",
      artwork: [{ src: meta.artwork, sizes: "512x512", type: "image/png" }],
    });
    ms.setActionHandler("play", h.onPlay);
    ms.setActionHandler("pause", h.onPause);
    ms.setActionHandler("stop", h.onPause);
  } catch {}
  return () => {
    try {
      ms.metadata = null;
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("stop", null);
    } catch {}
  };
}
