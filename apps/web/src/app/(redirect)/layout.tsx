import type { Metadata, Viewport } from "next";
import { getDictionary, defaultLocale } from "@arna/i18n";
import { SITE_URL, absUrl, withBase } from "@/lib/site";
import "../globals.css";

const d = getDictionary(defaultLocale);

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0e3b45" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: d.meta.title,
  description: d.meta.description,
  alternates: { canonical: absUrl(`/${defaultLocale}/`) },
  openGraph: { type: "website", siteName: "ARNA", title: d.meta.title, description: d.meta.description, images: [{ url: absUrl("/og.png"), width: 1200, height: 630 }] },
};

export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-font="cyrillic" data-theme="dark">
      <head>
        <link rel="icon" type="image/png" sizes="192x192" href={withBase("/brand/emblem-192.png")} />
        <link rel="apple-touch-icon" sizes="180x180" href={withBase("/brand/apple-touch-icon.png")} />
      </head>
      <body>{children}</body>
    </html>
  );
}
