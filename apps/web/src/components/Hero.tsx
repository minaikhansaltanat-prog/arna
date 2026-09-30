import { ArrowRight, Play } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { SECTIONS } from "@/lib/site";
import { HeroVisual, type Chip } from "./HeroVisual";
import { WaveCanvas } from "./WaveCanvas";

/** Greeting bubbles: other languages first (kk, en, zh, ar, ja, hi...), never the visitor's own. */
const CHIP_ORDER = ["kk", "en", "zh", "ar", "hi", "ko", "ja", "uz", "ky", "ru"];

export function Hero({ lang, dict, locales }: { lang: string; dict: Dictionary; locales: LocaleListItem[] }) {
  const h = dict.hero;
  const chips: Chip[] = CHIP_ORDER.filter((c) => c !== lang)
    .map((c) => locales.find((l) => l.code === c))
    .filter((l): l is LocaleListItem => Boolean(l))
    .slice(0, 6)
    .map((l) => ({ code: l.code, text: l.welcome, dir: l.dir, htmlLang: l.htmlLang }));

  return (
    <section id="top" className="hero relative isolate overflow-clip">
      <div aria-hidden className="hero-atmosphere absolute inset-0 -z-10" />

      <div
        className="wrap grid grid-cols-[minmax(0,1fr)] items-center gap-x-10 gap-y-9 pb-10 pt-[calc(var(--header-h)+var(--safe-top)+32px)] [grid-template-areas:'text'_'visual'_'stats'] lg:min-h-[min(860px,100dvh)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-y-0 lg:pb-16 lg:pt-[calc(var(--header-h)+56px)] lg:[grid-template-areas:'text_visual'_'stats_visual']"
      >
        <div className="[container-type:inline-size] [grid-area:text] lg:self-end">
          <p className="eyebrow anim-rise">{h.eyebrow}</p>
          <h1 className="hero-title anim-rise mt-5" style={{ ["--d" as string]: "80ms" }}>
            <span className="block">{h.title[0]}</span>
            <span className="hero-gold block">{h.title[1]}</span>
          </h1>
          <p className="anim-rise mt-6 max-w-[33rem] text-[1.0625rem] text-muted sm:text-lg" style={{ ["--d" as string]: "160ms" }}>
            {h.subtitle}
          </p>
          <div className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ ["--d" as string]: "240ms" }}>
            <a href={`#${SECTIONS.demo}`} className="btn btn-primary">
              <Play size={20} weight="fill" aria-hidden />
              {h.ctaDemo}
            </a>
            <a href={`#${SECTIONS.pilot}`} className="btn btn-ghost">
              {h.ctaPilot}
              <ArrowRight size={20} weight="bold" aria-hidden className="rtl:-scale-x-100" />
            </a>
          </div>
        </div>

        <div className="[grid-area:visual]">
          <HeroVisual chips={chips} alt="ARNA" />
        </div>

        <dl className="anim-rise grid grid-cols-3 gap-3 border-t border-line pt-6 [grid-area:stats] sm:gap-6 lg:self-start lg:pt-7" style={{ ["--d" as string]: "340ms" }}>
          {h.stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col-reverse gap-1.5">
              <dt className="text-[0.82rem] leading-snug text-muted sm:text-sm">{s.label}</dt>
              <dd className="m-0 flex items-baseline gap-1.5 font-display text-[clamp(1.9rem,5.4vw,2.7rem)] font-[var(--w-display)] leading-none text-accent">
                <bdi dir="ltr">{s.value}</bdi>
                {s.unit && <span className="text-[0.5em] font-semibold">{s.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* the signal: the brand tube waveform settling across the full width */}
      <div aria-hidden className="pointer-events-none relative -mb-px h-[130px] w-full sm:h-[180px]">
        <WaveCanvas className="absolute inset-0 size-full" amp={1.3} weight={0.062} speed={0.9} />
      </div>
    </section>
  );
}
