import { Info } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { demoScripts, demoSource } from "@/lib/demo-script";
import { SECTIONS } from "@/lib/site";
import { PhoneDemo } from "./PhoneDemo";
import { Reveal } from "./Reveal";

export function Demo({ dict, locales }: { dict: Dictionary["demo"]; locales: LocaleListItem[] }) {
  return (
    <section id={SECTIONS.demo} className="section demo-section">
      <div aria-hidden className="demo-backdrop" />
      <div className="wrap grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <Reveal>
          <h2 className="section-title">{dict.title}</h2>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] text-muted sm:text-lg">{dict.text}</p>
          <aside className="notice mt-8" role="note">
            <Info size={22} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-accent" />
            <p>{dict.notice}</p>
          </aside>
        </Reveal>

        <Reveal delay={120} className="relative mx-auto w-full max-w-[360px] lg:max-w-none">
          <div aria-hidden className="demo-halo" />
          <PhoneDemo dict={dict} locales={locales} scripts={demoScripts} source={demoSource} />
        </Reveal>
      </div>
    </section>
  );
}
