"use client";

import type { LocaleListItem } from "@arna/i18n";
import { withBase } from "@/lib/site";
import type { Slogan } from "./HeroCaption";
import { WaveCanvas } from "./WaveCanvas";

type Props = {
  locales: LocaleListItem[];
  slogans: Record<string, Slogan>;
  hint: string;
  speaker: string;
  picked: string | null;
  onPick: (code: string) => void;
};

/**
 * "Ten channels": the speaker's one wave (it enters from the left edge of the screen) passes through the ARNA mark
 * and splits into ten hairlines, one per language. The listener picks a strand; it turns gold, the speaker's wave takes
 * on that language's character, and the phone next to it starts the demo in that language.
 */
export function LangStrands({ locales, slogans, hint, speaker, picked, onPick }: Props) {
  const n = locales.length;
  const at = (i: number) => ((i + 0.5) / n) * 100;
  const active = locales.findIndex((l) => l.code === picked);
  const ai = Math.max(active, 0);
  const line = (i: number) => `M0 50 C 50 50, 50 ${at(i)}, 100 ${at(i)}`;
  const g = picked ? slogans[picked] : null;

  return (
    <div className="strands" role="group" aria-label={hint}>
      <p className="strands-hint">{hint}</p>

      <div className="strands-grid">
        <div className="strands-src">
          <WaveCanvas
            className="absolute inset-0 size-full"
            baseline={0.5}
            amp={0.46}
            weight={1.8}
            peak={0.78}
            peakNarrow={0.74}
            fade
            seed={picked ? 1 + ai * 1.9 : 0.6}
            speed={picked ? 0.85 + (ai % 4) * 0.1 : 0.8}
            spread={picked ? 0.9 + (ai % 3) * 0.14 : 1}
          />
          <span className="strands-who">{speaker}</span>
        </div>

        <img src={withBase("/brand/emblem-96.png")} width={48} height={48} alt="" className="strands-gate" />

        <svg className="strands-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden focusable="false">
          {locales.map((l, i) => i !== active && <path key={l.code} d={line(i)} className="strand" />)}
          {active >= 0 && <path d={line(active)} className="strand strand--on" />}
        </svg>

        <ul className="strands-list">
          {locales.map((l) => {
            const on = l.code === picked;
            const names = l.font !== "cyrillic" && l.font !== "latin";
            return (
              <li key={l.code}>
                <button type="button" className="strand-btn" aria-pressed={on} onClick={() => onPick(l.code)}>
                  <span className="strand-name" lang={l.htmlLang} dir={l.dir} data-names={names ? l.code : undefined}>
                    {l.nativeName}
                  </span>
                  <span className="strand-code" aria-hidden>
                    {l.code}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="strands-greet" aria-live="polite" lang={g?.htmlLang} dir={g?.dir} data-names={g?.names ? g.code : undefined}>
        {g ? g.text : " "}
      </p>
    </div>
  );
}
