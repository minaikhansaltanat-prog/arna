import { notFound } from "next/navigation";
import { getDictionary, getMeta, isLocale, localeList } from "@arna/i18n";
import { Cases } from "@/components/Cases";
import { Demo } from "@/components/Demo";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { How } from "@/components/How";
import { MotionProvider } from "@/components/MotionProvider";
import { Pilot } from "@/components/Pilot";
import { Pricing } from "@/components/Pricing";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { PHONE_TEL, SITE_URL } from "@/lib/site";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const meta = getMeta(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ARNA",
    url: `${SITE_URL}/${lang}/`,
    logo: `${SITE_URL}/brand/emblem-512.png`,
    telephone: PHONE_TEL,
    description: dict.meta.description,
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
        <Hero lang={lang} dict={dict} locales={localeList} />
        <How dict={dict.how} />
        <Demo dict={dict.demo} locales={localeList} />
        <Features dict={dict.features} locales={localeList} />
        <Cases dict={dict.cases} />
        <Pricing dict={dict.pricing} waMessage={dict.whatsapp.message} />
        <Pilot dict={dict.pilot} lang={lang} langName={meta.nativeName} waMessage={dict.whatsapp.message} />
      </main>
      <Footer lang={lang} dict={dict} locales={localeList} waMessage={dict.whatsapp.message} />
      <WhatsAppFab label={dict.whatsapp.label} message={dict.whatsapp.message} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </MotionProvider>
  );
}
