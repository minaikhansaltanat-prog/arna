"use client";

import { useEffect, useRef } from "react";
import { WaveCanvas } from "./WaveCanvas";

/**
 * The hero wave, edge to edge. It "speaks" while the page is scrolled: scroll speed lifts the level a little,
 * then it settles back. The level lives in a ref (read by the canvas every frame), so scrolling never re-renders.
 */
export function HeroWave({ className }: { className?: string }) {
  const level = useRef(0.74);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let boost = 0;
    let last = window.scrollY;
    let raf = 0;
    let running = false;
    const tick = () => {
      boost *= 0.93;
      level.current = 0.74 + 0.26 * Math.min(1, boost);
      if (boost > 0.01) raf = requestAnimationFrame(tick);
      else {
        running = false;
        level.current = 0.74;
      }
    };
    const onScroll = () => {
      const y = window.scrollY;
      boost = Math.min(1, boost + Math.abs(y - last) / 240);
      last = y;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <WaveCanvas className={className} levelRef={level} amp={0.92} weight={1.7} speed={0.9} peak={0.64} peakNarrow={0.52} />;
}
