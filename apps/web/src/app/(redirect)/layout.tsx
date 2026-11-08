import type { Metadata, Viewport } from "next";
import { getDictionary, getSlogan, defaultLocale } from "@arna/i18n";
import { ICONS, OG_IMAGE, socialText } from "@/lib/brand";
import { referralScript } from "@/lib/referral";
import { SITE_URL, absUrl } from "@/lib/site";
import "../globals.css";

const d = getDictionary(defaultLocale);
const social = socialText(defaultLocale, getSlogan(defaultLocale), d.meta.title, d.meta.description);

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0e3b45" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: d.meta.title,
  description: d.meta.description,
  alternates: { canonical: absUrl(`/${defaultLocale}/`) },
  openGraph: { type: "website", siteName: "ARNA", title: social.title, description: social.description, images: [{ url: absUrl(OG_IMAGE.path), width: OG_IMAGE.width, height: OG_IMAGE.height }] },
};

export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" translate="no" data-font="cyrillic" data-theme="dark">
      <head>
        <meta name="google" content="notranslate" />
        <script dangerouslySetInnerHTML={{ __html: referralScript }} />
        <link rel="icon" type="image/png" sizes="32x32" href={ICONS.favicon32} />
        <link rel="icon" type="image/png" sizes="96x96" href={ICONS.favicon96} />
        <link rel="apple-touch-icon" sizes="180x180" href={ICONS.appleTouch} />
      </head>
      <body>{children}</body>
    </html>
  );
}
