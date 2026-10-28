import { PhoneCall, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@arna/i18n";
import { PHONE_DISPLAY, PHONE_TEL, SECTIONS, waLink } from "@/lib/site";
import { PilotForm } from "./PilotForm";
import { Reveal } from "./Reveal";
import { SectionNode } from "./SectionNode";
import { WaveRule } from "./WaveRule";

/** The pilot sign-up: a full-width petrol block, the wave along its top edge, copy and contacts beside the form. */
export function Pilot({ dict, lang, langName, waMessage }: { dict: Dictionary["pilot"]; lang: string; langName: string; waMessage: string }) {
  return (
    <section id={SECTIONS.pilot} className="section pilot-section dark-scope">
      <WaveRule className="pilot-wave" peak={0.34} height={96} seed={5} />
      <div className="wrap relative grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <SectionNode />
        <Reveal>
          <h2 className="section-title">{dict.title}</h2>
          <p className="prose mt-5 text-[1.0625rem] text-muted sm:text-lg">{dict.text}</p>

          <div className="mt-9">
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
