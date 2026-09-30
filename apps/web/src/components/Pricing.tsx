import { ArrowUpRight, Check } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@arna/i18n";
import { SECTIONS, waLink } from "@/lib/site";
import { Reveal } from "./Reveal";

/** L-05: three sample plans with price and key terms, plus a link to the full pricing. */
export function Pricing({ dict, waMessage }: { dict: Dictionary["pricing"]; waMessage: string }) {
  return (
    <section id={SECTIONS.pricing} className="section">
      <div className="wrap">
        <Reveal>
          <h2 className="section-title max-w-[20ch]">{dict.title}</h2>
          <p className="mt-5 max-w-[34rem] text-[1.0625rem] text-muted">{dict.note}</p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:mt-16 lg:grid-cols-3 lg:items-stretch">
          {dict.plans.map((p, i) => {
            const hot = i === 1;
            return (
              <Reveal key={p.name} delay={i * 80} className={`price-card ${hot ? "price-card--hot" : ""}`}>
                {hot && <span className="price-flag">{dict.recommended}</span>}
                <h3 className="text-[1.3rem]">{p.name}</h3>
                <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <bdi dir="ltr" className={`price-value ${/\d/.test(p.price) ? "" : "price-value--text"}`}>
                    {p.price}
                  </bdi>
                  {p.period && <span className="text-[0.95rem] text-muted">{p.period}</span>}
                </p>
                <p className="mt-3 text-[0.98rem] text-muted">{p.desc}</p>
                <ul className="mt-6 flex list-none flex-col gap-3 p-0">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[0.98rem] leading-snug">
                      <Check size={18} weight="bold" aria-hidden className="mt-[3px] shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-9">
                  <a href={`#${SECTIONS.pilot}`} className={`btn w-full ${hot ? "btn-primary" : "btn-ghost"}`}>
                    {p.cta}
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-10">
          <a href={waLink(waMessage)} target="_blank" rel="noopener noreferrer" className="link-arrow">
            {dict.fullPricing}
            <ArrowUpRight size={18} weight="bold" aria-hidden className="rtl:-scale-x-100" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
