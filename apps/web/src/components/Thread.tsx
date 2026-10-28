"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * The thread: a hairline down the left edge of the content that ties the sections together and fills with gold
 * as the page is read (transform only). Each section hangs a small node on it (`SectionNode`).
 */
export function Thread() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.62", "end 0.62"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} aria-hidden className="wrap thread-host">
      <span className="thread-line" />
      <m.span className="thread-fill" style={{ scaleY: reduce ? 1 : fill }} />
    </div>
  );
}
