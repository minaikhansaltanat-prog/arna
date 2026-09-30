import type { MetadataRoute } from "next";
import { getMeta, locales } from "@arna/i18n";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [getMeta(l).htmlLang, `${SITE_URL}/${l}/`]));
  return locales.map((l) => ({
    url: `${SITE_URL}/${l}/`,
    changeFrequency: "monthly",
    priority: l === "ru" ? 1 : 0.8,
    alternates: { languages },
  }));
}
