import { PhoneCall, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { LIVE_URL, PHONE_DISPLAY, PHONE_TEL, PRIVACY_URL, SECTIONS, waLink, withBase } from "@/lib/site";
import { BrandLockup } from "./BrandLockup";
import { WaveRule } from "./WaveRule";

const LINKS = ["how", "modules", "demo", "cases", "pricing"] as const;

export function Footer({
  lang,
  dict,
  locales,
  waMessage,
}: {
  lang: string;
  dict: Dictionary;
  locales: LocaleListItem[];
  waMessage: string;
}) {
  const f = dict.footer;
  return (
    <footer className="site-footer">
      <WaveRule className="footer-wave" peak={0.7} height={72} seed={7} />
      <div className="wrap pb-32 pt-12 lg:pb-28 lg:pt-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[minmax(0,3.4fr)_minmax(0,2.8fr)_minmax(0,3.6fr)_minmax(0,3.6fr)] lg:gap-10">
          <div>
            <BrandLockup lang={lang} variant="footer" />
            <p className="mt-5 max-w-[22rem] text-[1.05rem] text-muted">{f.tagline}</p>
          </div>

          <nav aria-label={f.navTitle}>
            <h2 className="footer-title">{f.navTitle}</h2>
            <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
              {LINKS.map((id) => (
                <li key={id}>
                  <a href={`#${SECTIONS[id]}`} className="footer-link">
                    {dict.nav[id]}
                  </a>
                </li>
              ))}
              <li>
                <a href={`#${SECTIONS.pilot}`} className="footer-link">
                  {dict.nav.pilot}
                </a>
              </li>
              <li>
                <a href={LIVE_URL} className="footer-link">
                  {dict.nav.live}
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="footer-title">{f.contactTitle}</h2>
            <ul className="mt-4 flex list-none flex-col gap-3 p-0">
              <li>
                <a href={`tel:${PHONE_TEL}`} className="footer-link inline-flex items-center gap-2.5">
                  <PhoneCall size={20} weight="duotone" aria-hidden className="text-accent" />
                  <span className="sr-only">{f.phone}: </span>
                  <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
                </a>
              </li>
              <li>
                <a href={waLink(waMessage)} target="_blank" rel="noopener noreferrer" className="footer-link inline-flex items-center gap-2.5">
                  <WhatsappLogo size={20} weight="fill" aria-hidden className="text-wa" />
                  <span>{dict.pilot.whatsapp}</span>
                  <bdi dir="ltr" className="text-muted">
                    {PHONE_DISPLAY}
                  </bdi>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="footer-title">{f.langsTitle}</h2>
            <ul className="mt-4 grid list-none grid-cols-[repeat(2,minmax(0,1fr))] gap-x-4 gap-y-2.5 p-0">
              {locales.map((l) => (
                <li key={l.code}>
                  <a href={withBase(`/${l.code}/`)} hrefLang={l.htmlLang} lang={l.htmlLang} dir={l.dir} aria-current={l.code === lang ? "true" : undefined} className="footer-link" data-names={l.code}>
                    {l.nativeName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 border-t border-line pt-6 text-[0.9rem] text-muted">
          <p>{f.rights}</p>
          <a href={PRIVACY_URL} className="footer-link">
            {f.privacy}
          </a>
        </div>
      </div>
    </footer>
  );
}
