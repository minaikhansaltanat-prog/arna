import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import ReactDOM from "react-dom";
import type { Dictionary } from "@arna/i18n";
import { HERO_LOGO_SIZES, LOGO } from "@/lib/brand";
import { LIVE_URL, SECTIONS } from "@/lib/site";
import { BrandLockup } from "./BrandLockup";
import { HeroAxis } from "./HeroAxis";
import { HeroCaption, type Slogan } from "./HeroCaption";
import { HeroWave } from "./HeroWave";

/**
 * The first screen fills the whole viewport: the slogan, one thin gold wave from edge to edge, one main action
 * (the live product), and the five modules as stations on one line. The wave is on the first screen at every size.
 */
export function Hero({ dict, slogans, lang }: { dict: Dictionary; slogans: Slogan[]; lang: string }) {
  const h = dict.hero;
  // the logo is the first thing on the screen: fetch the file the browser will pick for this width and density right away
  ReactDOM.preload(LOGO.webp480, { as: "image", type: "image/webp", imageSrcSet: LOGO.webpSrcSet, imageSizes: HERO_LOGO_SIZES, fetchPriority: "high" });
  return (
    <section id="top" className="hero">
      <div aria-hidden className="hero-glow" />

      <div className="wrap hero-top">
        <BrandLockup lang={lang} variant="hero" className="hero-lockup" />
        <h1 className="hero-title" style={{ ["--hero-chars" as string]: Math.max(...h.title.map((t) => [...t].length)) }}>
          <span className="anim-rise block">{h.title[0]}</span>
          <span className="anim-rise hero-gold block" style={{ ["--d" as string]: "90ms" }}>
            {h.title[1]}
          </span>
        </h1>
      </div>

      <div aria-hidden className="hero-wave">
        <HeroWave className="absolute inset-0 size-full" />
      </div>

      <div className="wrap hero-foot">
        <div className="hero-copy anim-rise" style={{ ["--d" as string]: "200ms" }}>
          <p className="hero-sub">{h.subtitle}</p>
          <div className="hero-cta">
            <a href={LIVE_URL} className="btn btn-primary">
              {h.ctaLive}
              <ArrowUpRight size={20} weight="bold" aria-hidden className="rtl:-scale-x-100" />
            </a>
            <a href={`#${SECTIONS.pilot}`} className="btn btn-ghost">
              {h.ctaPilot}
              <ArrowRight size={20} weight="bold" aria-hidden className="rtl:-scale-x-100" />
            </a>
          </div>
        </div>
        <HeroCaption items={slogans} />
        <HeroAxis label={dict.nav.modules} names={dict.modules.items.map((m) => m.name)} />
      </div>
    </section>
  );
}
