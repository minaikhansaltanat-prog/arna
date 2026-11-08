import { LOGO } from "@/lib/brand";

/**
 * The ARNA logo picture (WebP with a PNG fallback, two widths). Never lazy: it is on the first screen. The width and height
 * attributes give its proportions, so nothing moves when it loads. Size it with CSS (the lockup or the header does).
 * `alt=""` when a link around it already has a name.
 */
export function BrandLogo({
  sizes,
  className,
  alt = LOGO.alt,
  priority = false,
}: {
  /** the `sizes` attribute: the width the logo is shown at */
  sizes: string;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <picture>
      <source type="image/webp" srcSet={LOGO.webpSrcSet} sizes={sizes} />
      <img
        src={LOGO.png}
        srcSet={LOGO.pngSrcSet}
        sizes={sizes}
        width={LOGO.width}
        height={LOGO.height}
        alt={alt}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={className}
      />
    </picture>
  );
}
