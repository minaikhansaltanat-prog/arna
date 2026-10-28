"use client";

import { useEffect, useState } from "react";

export type Slogan = { code: string; text: string; dir: "ltr" | "rtl"; htmlLang: string; names: boolean };

/**
 * A live caption under the wave: the slogan in the other languages, one after another (opacity only).
 * Decorative (the real slogan is the h1), so it is hidden from assistive tech and stands still under reduced motion.
 */
export function HeroCaption({ items }: { items: Slogan[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % items.length), 3800);
    return () => window.clearInterval(id);
  }, [items.length]);

  const c = items[i];
  if (!c) return null;
  return (
    <p className="hero-caption" aria-hidden="true">
      <span key={c.code} className="hero-caption__line" lang={c.htmlLang} dir={c.dir} data-names={c.names ? c.code : undefined}>
        {c.text}
      </span>
      <span className="hero-caption__code">{c.code}</span>
    </p>
  );
}
