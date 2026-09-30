"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/** One lightweight Motion runtime for the page (only `m.*` components are allowed inside). Honors prefers-reduced-motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
