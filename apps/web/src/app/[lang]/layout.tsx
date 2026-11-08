import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import ReactDOM from "react-dom";
import { getDictionary, getMeta, getSlogan, isLocale, locales } from "@arna/i18n";
import { ICONS, OG_IMAGE, socialText } from "@/lib/brand";
import { preloadFontsFor } from "@/lib/fonts";
import { referralScript } from "@/lib/referral";
import { SITE_URL, absUrl, withBase } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e3b45" },
    { media: "(prefers-color-scheme: light)", color: "#f1f6f5" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDictionary(lang);
  const languages = Object.fromEntries(locales.map((l) => [getMeta(l).htmlLang, absUrl(`/${l}/`)]));
  const social = socialText(lang, getSlogan(lang), d.meta.title, d.meta.description);
  return {
    metadataBase: new URL(SITE_URL),
    title: d.meta.title,
    description: d.meta.description,
    applicationName: "ARNA",
    alternates: { canonical: absUrl(`/${lang}/`), languages: { ...languages, "x-default": absUrl("/ru/") } },
    openGraph: {
      type: "website",
      siteName: "ARNA",
      title: social.title,
      description: social.description,
      url: absUrl(`/${lang}/`),
      locale: getMeta(lang).ogLocale,
      alternateLocale: locales.filter((l) => l !== lang).map((l) => getMeta(l).ogLocale),
      images: [{ url: absUrl(OG_IMAGE.path), width: OG_IMAGE.width, height: OG_IMAGE.height, alt: social.title }],
    },
    twitter: { card: "summary_large_image", title: social.title, description: social.description, images: [absUrl(OG_IMAGE.path)] },
    formatDetection: { telephone: false },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const meta = getMeta(lang);

  // Only the fonts this language needs are fetched early (TZ 3.1 / I-04).
  for (const href of preloadFontsFor(lang)) {
    ReactDOM.preload(withBase(href), { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }

  return (
    <html lang={meta.htmlLang} dir={meta.dir} translate="no" data-font={meta.font} suppressHydrationWarning>
      <head>
        {/* the page already comes in ten languages; Chrome's auto-translate would rewrite the typed demo text */}
        <meta name="google" content="notranslate" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: referralScript }} />
        {/* own-origin icons (metadata would turn them into absolute production URLs) */}
        <link rel="icon" type="image/png" sizes="32x32" href={ICONS.favicon32} />
        <link rel="icon" type="image/png" sizes="96x96" href={ICONS.favicon96} />
        <link rel="apple-touch-icon" sizes="180x180" href={ICONS.appleTouch} />
      </head>
      <body>{children}</body>
    </html>
  );
}
