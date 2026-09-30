import { Archive, ListChecks, LockSimple, Microphone, ShareNetwork, Translate } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { SECTIONS } from "@/lib/site";
import { Reveal } from "./Reveal";
import { WaveCanvas } from "./WaveCanvas";

/**
 * L-02: six feature cards as a bento with rhythm (7/5, 5/7, 7/5) and real visual variation:
 * live waveform, language cloud, plain surface, photo, solid gold, dark equalizer.
 */
export function Features({ dict, locales }: { dict: Dictionary["features"]; locales: LocaleListItem[] }) {
  const [voice, translate, summary, content, referral, background] = dict.items;

  return (
    <section id={SECTIONS.features} className="section">
      <div className="wrap">
        <Reveal>
          <h2 className="section-title max-w-[22ch]">{dict.title}</h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6 lg:mt-16 lg:grid-cols-12 lg:gap-5">
          {/* 1. voice recognition: live waveform */}
          <Reveal className="bento dark-scope bento--voice md:col-span-6 lg:col-span-7">
            <span className="bento-icon">
              <Microphone size={26} weight="duotone" aria-hidden />
            </span>
            <h3 className="bento-title">{voice.title}</h3>
            <p className="bento-text">{voice.text}</p>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[130px] sm:h-[150px]">
              <WaveCanvas className="size-full" amp={0.8} weight={0.07} speed={0.8} seed={4} />
            </div>
          </Reveal>

          {/* 2. multilingual translation: the ten languages */}
          <Reveal delay={60} className="bento bento--lang md:col-span-3 lg:col-span-5">
            <span className="bento-icon">
              <Translate size={26} weight="duotone" aria-hidden />
            </span>
            <h3 className="bento-title">{translate.title}</h3>
            <p className="bento-text">{translate.text}</p>
            <ul className="mt-6 flex list-none flex-wrap gap-2 p-0">
              {locales.map((l) => (
                <li key={l.code} className="lang-chip" lang={l.htmlLang} dir={l.dir} data-names={l.code}>
                  {l.nativeName}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* 3. auto-summary */}
          <Reveal delay={60} className="bento md:col-span-3 lg:col-span-5">
            <span className="bento-icon">
              <ListChecks size={26} weight="duotone" aria-hidden />
            </span>
            <h3 className="bento-title">{summary.title}</h3>
            <p className="bento-text">{summary.text}</p>
            <ListChecks aria-hidden size={220} weight="duotone" className="pointer-events-none absolute -bottom-10 -end-8 text-gold opacity-[0.13] rtl:-scale-x-100" />
          </Reveal>

          {/* 4. event content: photo */}
          <Reveal className="bento bento--photo dark-scope md:col-span-6 lg:col-span-7">
            <img src="/images/stage.webp" width={1800} height={1353} alt="" loading="lazy" decoding="async" className="photo-fill" />
            <div aria-hidden className="photo-tint" />
            <div aria-hidden className="photo-fade" />
            <div className="relative mt-auto pt-28">
              <span className="bento-icon">
                <Archive size={26} weight="duotone" aria-hidden />
              </span>
              <h3 className="bento-title">{content.title}</h3>
              <p className="bento-text max-w-[30rem]">{content.text}</p>
            </div>
          </Reveal>

          {/* 5. referral: solid gold */}
          <Reveal className="bento bento--gold md:col-span-3 lg:col-span-7">
            <div aria-hidden className="gold-rings" />
            <span className="bento-icon bento-icon--ink">
              <ShareNetwork size={26} weight="duotone" aria-hidden />
            </span>
            <h3 className="bento-title">{referral.title}</h3>
            <p className="bento-text max-w-[30rem]">{referral.text}</p>
          </Reveal>

          {/* 6. background mode: dark with equalizer */}
          <Reveal delay={60} className="bento bento--bg dark-scope md:col-span-3 lg:col-span-5">
            <span className="bento-icon">
              <LockSimple size={26} weight="duotone" aria-hidden />
            </span>
            <h3 className="bento-title">{background.title}</h3>
            <p className="bento-text">{background.text}</p>
            <div aria-hidden className="mt-7 h-12 max-w-[260px]">
              <div className="eq">
                {Array.from({ length: 22 }, (_, i) => (
                  <span key={i} style={{ ["--i" as string]: i }} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
