import type { Dictionary } from "@arna/i18n";
import { LIVE_URL, SECTIONS } from "@/lib/site";
import { ModuleTabs } from "./ModuleTabs";
import { Reveal } from "./Reveal";
import { SectionNode } from "./SectionNode";

/** The five modules (Live, Network, Video, Read, Talk) as stations on one line, one panel each. */
export function Modules({ dict, nav, ctaLive, ctaPilot }: { dict: Dictionary["modules"]; nav: string; ctaLive: string; ctaPilot: string }) {
  return (
    <section id={SECTIONS.modules} className="section section--recessed">
      <div className="wrap relative">
        <SectionNode />
        <Reveal>
          <h2 className="section-title max-w-[22ch]">{dict.title}</h2>
        </Reveal>
      </div>
      <Reveal className="mt-12 lg:mt-16">
        <ModuleTabs items={dict.items} label={nav} liveHref={LIVE_URL} liveLabel={ctaLive} pilotHref={`#${SECTIONS.pilot}`} pilotLabel={ctaPilot} />
      </Reveal>
    </section>
  );
}
