import { notFound } from "next/navigation";
import { getDictionary, getMeta, isLocale, localeList } from "@arna/i18n";
import { Cases } from "@/components/Cases";
import { Demo } from "@/components/Demo";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import type { Slogan } from "@/components/HeroCaption";
import { How } from "@/components/How";
import { Modules } from "@/components/Modules";
import { MotionProvider } from "@/components/MotionProvider";
import { Pilot } from "@/components/Pilot";
import { Pricing } from "@/components/Pricing";
import { Thread } from "@/components/Thread";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { LIVE_URL, PHONE_TEL, absUrl } from "@/lib/site";

/** The slogan caption under the hero wave cycles through the other languages in this order. */
const SLOGAN_ORDER = ["en", "kk", "ru", "zh", "ar", "hi", "ko", "ja", "uz", "ky"];

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const meta = getMeta(lang);

  // the slogan in every language (hero caption, and the line under the language strands)
  const slogans: Record<string, Slogan> = Object.fromEntries(
    localeList.map((l) => [
      l.code,
      { code: l.code, text: getDictionary(l.code).hero.title.join(" "), dir: l.dir, htmlLang: l.htmlLang, names: l.font !== "cyrillic" && l.font !== "latin" },
    ]),
  );
  const rotating = SLOGAN_ORDER.filter((c) => c !== lang && slogans[c]).map((c) => slogans[c]);

  const org = absUrl("/#organization");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: "ARNA",
        url: absUrl("/"),
        logo: absUrl("/brand/emblem-512.png"),
        telephone: PHONE_TEL,
        slogan: slogans.en.text,
      },
      {
        "@type": "WebSite",
        "@id": absUrl("/#website"),
        name: "ARNA",
        url: absUrl(`/${lang}/`),
        inLanguage: meta.htmlLang,
        description: dict.meta.description,
        publisher: { "@id": org },
      },
      {
        "@type": "SoftwareApplication",
        name: "ARNA Live",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: LIVE_URL,
        description: dict.meta.description,
        inLanguage: localeList.map((l) => l.htmlLang),
        publisher: { "@id": org },
      },
    ],
  };

  return (
    <MotionProvider>
      <a href="#main" className="skip-link">
        {dict.a11y.skip}
      </a>
      <Header
        lang={lang}
        locales={localeList}
        nav={dict.nav}
        a11y={dict.a11y}
        call={dict.pilot.call}
        whatsapp={dict.pilot.whatsapp}
        waMessage={dict.whatsapp.message}
      />
      <main id="main">
        <Hero dict={dict} slogans={rotating} />
        <div className="relative">
          <Thread />
          <How dict={dict.how} />
          <Modules dict={dict.modules} nav={dict.nav.modules} ctaLive={dict.hero.ctaLive} ctaPilot={dict.hero.ctaPilot} />
          <Demo dict={dict.demo} locales={localeList} slogans={slogans} />
          <Cases dict={dict.cases} />
          <Pricing dict={dict.pricing} waMessage={dict.whatsapp.message} />
          <Pilot dict={dict.pilot} lang={lang} langName={meta.nativeName} waMessage={dict.whatsapp.message} />
        </div>
      </main>
      <Footer lang={lang} dict={dict} locales={localeList} waMessage={dict.whatsapp.message} />
      <WhatsAppFab label={dict.whatsapp.label} message={dict.whatsapp.message} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </MotionProvider>
  );
}
