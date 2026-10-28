import type { Dictionary } from "@arna/i18n";
import { SECTIONS, withBase } from "@/lib/site";
import { Reveal } from "./Reveal";
import { SectionNode } from "./SectionNode";
import { WaveRule } from "./WaveRule";

/**
 * Who it is for: four audiences as a short timeline, next to one real stage photo that bleeds to the screen edge.
 * The wave crosses the photo: one voice, many listeners.
 */
export function Cases({ dict }: { dict: Dictionary["cases"] }) {
  return (
    <section id={SECTIONS.cases} className="section cases-section">
      <div className="wrap relative cases-grid">
        <SectionNode />

        <Reveal className="cases-title">
          <h2 className="section-title max-w-[20ch]">{dict.title}</h2>
        </Reveal>

        <Reveal delay={60} className="cases-photo dark-scope">
          <img src={withBase("/images/stage.webp")} width={1800} height={1353} alt={dict.photoAlt} loading="lazy" decoding="async" className="photo-fill" />
          <div aria-hidden className="photo-tint" />
          <div aria-hidden className="photo-fade" />
          <WaveRule className="cases-wave" peak={0.6} height={120} seed={3} />
        </Reveal>

        <ul className="audience">
          {dict.items.map((item, i) => (
            <Reveal as="li" key={item.title} delay={i * 70} className="audience-item">
              <h3 className="audience-title">{item.title}</h3>
              <p className="audience-text">{item.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
