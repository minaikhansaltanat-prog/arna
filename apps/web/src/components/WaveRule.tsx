"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { wavePath } from "@/lib/wave";

/**
 * A thin gold wave, full width of its container (and of the screen when placed outside `.wrap`).
 * Static drawing (same shape as the animated hero wave); it opens from the centre once, as it scrolls into view.
 */
export function WaveRule({
  peak = 0.5,
  height = 84,
  seed = 0,
  className = "",
}: {
  peak?: number;
  height?: number;
  seed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1440);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    let io: IntersectionObserver | undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setOn(true);
    else {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io?.disconnect();
        }
      }, { threshold: 0.3 });
      io.observe(el);
    }
    return () => {
      ro.disconnect();
      io?.disconnect();
    };
  }, []);

  const d = useMemo(() => wavePath(w, height * 0.58, height * 0.5, peak, 2, seed), [w, height, peak, seed]);

  return (
    <div ref={ref} aria-hidden className={`wave-rule ${className}`} data-on={on} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
