import { PhoneCall, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@arna/i18n";
import { PHONE_DISPLAY, PHONE_TEL, SECTIONS, waLink, withBase } from "@/lib/site";
import { PilotForm } from "./PilotForm";
import { Reveal } from "./Reveal";

/** L-06 / 5.4: the pilot sign-up. Copy and contacts on one side, the form (floating layer) on the other. */
export function Pilot({ dict, lang, langName, waMessage }: { dict: Dictionary["pilot"]; lang: string; langName: string; waMessage: string }) {
  return (
    <section id={SECTIONS.pilot} className="section section--recessed pilot-section">
      <div className="wrap grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <Reveal>
          <h2 className="section-title">{dict.title}</h2>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] text-muted sm:text-lg">{dict.text}</p>

          <div className="photo-card dark-scope mt-9 hidden md:block">
            <img src={withBase("/images/panel.webp")} width={1200} height={800} alt="" loading="lazy" decoding="async" className="photo-fill" style={{ objectPosition: "50% 60%" }} />
            <div aria-hidden className="photo-tint" />
            <div aria-hidden className="photo-fade" />
          </div>

          <div className="mt-8">
            <p className="text-[0.95rem] font-semibold">{dict.contactTitle}</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${PHONE_TEL}`} className="btn btn-ghost">
                <PhoneCall size={22} weight="duotone" aria-hidden />
                {dict.call}
                <bdi dir="ltr" className="font-semibold">
                  {PHONE_DISPLAY}
                </bdi>
              </a>
              <a href={waLink(waMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                <WhatsappLogo size={22} weight="fill" aria-hidden />
                {dict.whatsapp}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="card-float p-6 sm:p-9">
          <PilotForm dict={dict} lang={lang} langName={langName} />
        </Reveal>
      </div>
    </section>
  );
}
