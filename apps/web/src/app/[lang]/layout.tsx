import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import ReactDOM from "react-dom";
import { getDictionary, getMeta, isLocale, locales } from "@arna/i18n";
import { preloadFontsFor } from "@/lib/fonts";
import { SITE_URL, STORAGE } from "@/lib/site";
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
  const languages = Object.fromEntries(locales.map((l) => [getMeta(l).htmlLang, `/${l}/`]));
  return {
    metadataBase: new URL(SITE_URL),
    title: d.meta.title,
    description: d.meta.description,
    applicationName: "ARNA",
    alternates: { canonical: `/${lang}/`, languages: { ...languages, "x-default": "/ru/" } },
    openGraph: {
      type: "website",
      siteName: "ARNA",
      title: d.meta.title,
      description: d.meta.description,
      url: `/${lang}/`,
      locale: getMeta(lang).ogLocale,
      alternateLocale: locales.filter((l) => l !== lang).map((l) => getMeta(l).ogLocale),
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "ARNA" }],
    },
    twitter: { card: "summary_large_image", title: d.meta.title, description: d.meta.description, images: ["/og.png"] },
    icons: {
      icon: [
        { url: "/brand/emblem-96.png", sizes: "96x96", type: "image/png" },
        { url: "/brand/emblem-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
    },
    formatDetection: { telephone: false },
  };
}

/** Runs before paint: picks the saved theme, else the system theme. Prevents a light/dark flash. */
const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(STORAGE.theme)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`;

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
    ReactDOM.preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }

  return (
    <html lang={meta.htmlLang} dir={meta.dir} data-font={meta.font} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
