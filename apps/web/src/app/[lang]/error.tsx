"use client";

import { useParams } from "next/navigation";
import slogans from "@arna/i18n/slogan.json";
import { BrandScreen } from "@/components/BrandScreen";
import { withBase } from "@/lib/site";

/** Error page of the site: only the brand (the logo is a link home, which reloads the page). The language, direction and script come from <html>. */
export default function ErrorPage() {
  const { lang } = useParams<{ lang: string }>();
  const text = (slogans as Record<string, string>)[lang] ?? slogans.ru;
  const root = typeof document !== "undefined" ? document.documentElement : null;
  return (
    <BrandScreen
      href={withBase(`/${lang}/`)}
      label="ARNA"
      slogan={text}
      dir={root?.dir === "rtl" ? "rtl" : "ltr"}
      script={root?.dataset.font ?? "cyrillic"}
    />
  );
}
