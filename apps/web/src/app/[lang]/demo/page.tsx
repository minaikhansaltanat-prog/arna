import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { getDictionary, isLocale, localeList } from "@arna/i18n";
import { MotionProvider } from "@/components/MotionProvider";
import { PhoneDemo } from "@/components/PhoneDemo";
import { QrCode } from "@/components/QrCode";
import { WaveCanvas } from "@/components/WaveCanvas";
import { demoScripts, demoSource } from "@/lib/demo-script";
import { absUrl, withBase } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDictionary(lang);
  return {
    title: `ARNA: ${d.demo.title}`,
    description: d.demo.text,
    alternates: { canonical: absUrl(`/${lang}/demo/`) },
    appleWebApp: { capable: true, title: "ARNA", statusBarStyle: "black-translucent" },
  };
}

/**
 * Standalone demo page ("/<lang>/demo/"). Phones: the scripted demo fills the whole screen like an app.
 * Larger screens: a centred phone frame, the story on the left and a QR code to open it on a phone.
 */
export default async function DemoPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const d = dict.demo;
  const dicts = Object.fromEntries(localeList.map((l) => [l.code, getDictionary(l.code).demo]));

  return (
    <MotionProvider>
      <main className="demo-app relative isolate">
        <div aria-hidden className="hero-atmosphere absolute inset-0 -z-10" />
        <div aria-hidden className="demo-app__wave">
          <WaveCanvas className="size-full" amp={1.1} weight={0.06} speed={0.8} seed={1} />
        </div>
        <h1 className="sr-only">{d.title}</h1>

        <div className="demo-app__inner">
        <div className="demo-app__side">
          <a href={withBase(`/${lang}/`)} className="brand-link" aria-label={dict.a11y.home}>
            <img src={withBase("/brand/emblem-96.png")} width={44} height={44} alt="" className="size-11" />
            <span className="brand-word">ARNA</span>
          </a>
          <h2 aria-hidden className="section-title mt-10">
            {d.title}
          </h2>
          <p className="mt-5 max-w-[28rem] text-lg text-muted">{d.text}</p>
          <div className="notice mt-8 max-w-[30rem]" role="note">
            <Info size={22} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-accent" />
            <p>{d.notice}</p>
          </div>
          <div className="qr-card mt-8">
            <QrCode label={d.qr.title} />
            <div>
              <p className="font-display text-[1.15rem] font-[var(--w-display)]">{d.qr.title}</p>
              <p className="mt-1.5 max-w-[16rem] text-[0.95rem] text-muted">{d.qr.hint}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div aria-hidden className="demo-halo" />
          <PhoneDemo appMode dict={d} dicts={dicts} locales={localeList} scripts={demoScripts} source={demoSource} />
        </div>
        </div>
      </main>
    </MotionProvider>
  );
}
