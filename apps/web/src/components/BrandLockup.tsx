import { getMeta, getSlogan, type Locale } from "@arna/i18n";
import { HERO_LOGO_SIZES, sloganEm } from "@/lib/brand";
import { BrandLogo } from "./BrandLogo";

/**
 * The logo and, under it, the slogan. The same markup in every place:
 *  - hero: the first screen, large; footer: small; 404 and error pages: large
 *  - compact: only the logo (demo page), no slogan
 * The slogan is a plain paragraph (not a heading) so it does not compete with the H1 and H2 of the page.
 * Sizes come from CSS (.lockup in ui.css): the logo width is --logo-w, the slogan is about 5.5% of it (13px at least),
 * 4.5% below the logo, and spans 55 to 70% of the logo width; --slogan-em is the width of the text in em.
 */
export function BrandLockupView({
  variant,
  slogan,
  dir,
  script,
  className = "",
}: {
  variant: "hero" | "footer" | "compact";
  slogan: string;
  /** reading direction of the slogan */
  dir: "ltr" | "rtl";
  /** the `font` of the language (cyrillic, latin, cjk-sc, arabic, ...): decides the tracking and the width estimate */
  script: string;
  className?: string;
}) {
  if (variant === "compact") {
    return <BrandLogo sizes="140px" alt="" priority className={className} />;
  }
  return (
    <div className={`lockup ${className}`.trim()} data-variant={variant} style={{ ["--slogan-em" as string]: sloganEm(slogan, script) }}>
      <BrandLogo sizes={variant === "hero" ? HERO_LOGO_SIZES : "220px"} priority={variant === "hero"} className="lockup__logo" />
      <p className="lockup__slogan" dir={dir} data-script={script}>
        {slogan}
      </p>
    </div>
  );
}

/** The lockup in the language of a page (slogan from packages/i18n/slogan.json). */
export function BrandLockup({ lang, variant, className }: { lang: string; variant: "hero" | "footer" | "compact"; className?: string }) {
  const meta = getMeta(lang as Locale);
  return <BrandLockupView variant={variant} slogan={getSlogan(lang as Locale)} dir={meta.dir} script={meta.font} className={className} />;
}
