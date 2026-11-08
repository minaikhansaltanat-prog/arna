import { BrandLockupView } from "./BrandLockup";

/**
 * A page that has nothing to say but the brand: the 404 page and the error page. The logo (a link home) with the slogan under it,
 * and, if there is one, a code. It needs no dictionary, so it is safe in the small client bundle of an error boundary.
 */
export function BrandScreen({
  href,
  label,
  slogan,
  dir,
  script,
  alternatives,
  code,
}: {
  href: string;
  /** accessible name of the link home */
  label: string;
  slogan: string;
  dir: "ltr" | "rtl";
  script: string;
  alternatives?: { code: string; lang: string; slogan: string; dir: "ltr" | "rtl"; script: string }[];
  code?: string;
}) {
  return (
    <main className="brand-screen">
      <a href={href} className="brand-screen__home" aria-label={label}>
        <BrandLockupView variant="hero" slogan={slogan} dir={dir} script={script} alternatives={alternatives} />
      </a>
      {code && <p className="brand-screen__code">{code}</p>}
    </main>
  );
}
