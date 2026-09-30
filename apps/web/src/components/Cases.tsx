import { Briefcase, ChalkboardTeacher, Confetti, GraduationCap, Presentation } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@arna/i18n";
import { SECTIONS } from "@/lib/site";
import { Reveal } from "./Reveal";

/** Order matches dictionary `cases.items`: universities, forums, weddings, companies, trainers. */
const VISUALS = [
  { img: "university", Icon: GraduationCap, pos: "50% 35%" },
  { img: "forum", Icon: Presentation, pos: "50% 45%" },
  { img: "wedding", Icon: Confetti, pos: "44% 55%" },
  { img: "company", Icon: Briefcase, pos: "30% 50%" },
  { img: "trainer", Icon: ChalkboardTeacher, pos: "50% 40%" },
] as const;

/** L-03: short photo cards. Staggered on desktop, plain stack on phones. */
export function Cases({ dict }: { dict: Dictionary["cases"] }) {
  return (
    <section id={SECTIONS.cases} className="section section--recessed">
      <div className="wrap">
        <Reveal>
          <h2 className="section-title max-w-[20ch]">{dict.title}</h2>
        </Reveal>

        <ul className="mt-12 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:mt-16 lg:grid-cols-5 lg:gap-5 lg:pb-14">
          {dict.items.map((item, i) => {
            const v = VISUALS[i];
            return (
              <Reveal as="li" key={item.title} delay={i * 70} className={`case-card dark-scope ${i % 2 ? "lg:translate-y-12" : ""} ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                <img
                  src={`/images/${v.img}.webp`}
                  width={1200}
                  height={800}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="photo-fill"
                  style={{ objectPosition: v.pos }}
                />
                <div aria-hidden className="photo-tint" />
                <div aria-hidden className="photo-fade" />
                <span className="case-icon">
                  <v.Icon size={24} weight="duotone" aria-hidden />
                </span>
                <div className="case-copy">
                  <h3 className="text-[1.4rem] lg:text-[1.3rem]">{item.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-snug text-fg/85">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
