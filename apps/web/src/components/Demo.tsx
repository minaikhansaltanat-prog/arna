import { Info } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { demoScripts, demoSource } from "@/lib/demo-script";
import { SECTIONS } from "@/lib/site";
import { DemoStage } from "./DemoStage";
import type { Slogan } from "./HeroCaption";
import { Reveal } from "./Reveal";

/** A full-width petrol block: the language strands and the scripted phone, side by side. */
export function Demo({ dict, locales, slogans }: { dict: Dictionary["demo"]; locales: LocaleListItem[]; slogans: Record<string, Slogan> }) {
  return (
    <section id={SECTIONS.demo} className="section demo-section dark-scope">
      <div aria-hidden className="demo-backdrop" />
      <DemoStage
        dict={dict}
        locales={locales}
        scripts={demoScripts}
        source={demoSource}
        slogans={slogans}
        intro={
          <Reveal>
            <h2 className="section-title">{dict.title}</h2>
            <p className="prose mt-5 text-[1.0625rem] text-muted sm:text-lg">{dict.text}</p>
          </Reveal>
        }
        notice={
          <Reveal>
            <aside className="notice" role="note">
              <Info size={22} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <p>{dict.notice}</p>
            </aside>
          </Reveal>
        }
      />
    </section>
  );
}
