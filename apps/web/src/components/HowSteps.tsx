"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useScroll } from "motion/react";

/**
 * The four steps (L-04, a numbered list). A gold "tube" rail fills as the list scrolls into view:
 * horizontal on wider screens, vertical on phones (storytelling: the signal travels from stage to phone).
 * Motion values drive transform only, so nothing re-renders while scrolling.
 */
export function HowSteps({ steps }: { steps: { title: string; text: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 78%", "end 58%"] });

  return (
    <ol ref={ref} className="how-steps relative mt-14 grid list-none grid-cols-1 gap-12 p-0 md:mt-16 md:grid-cols-4 md:gap-8">
      <span aria-hidden className="how-rail how-rail--v md:hidden" />
      <m.span aria-hidden className="how-fill how-fill--v md:hidden" style={{ scaleY: scrollYProgress }} />
      <span aria-hidden className="how-rail how-rail--h hidden md:block" />
      <m.span aria-hidden className="how-fill how-fill--h hidden md:block" style={{ scaleX: scrollYProgress }} />

      {steps.map((s, i) => (
        <li key={s.title} className="how-step relative ps-[76px] md:ps-0 md:pt-[84px]">
          <span className="how-node" aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="text-[1.3rem] leading-snug md:text-[1.25rem]">{s.title}</h3>
          <p className="mt-2.5 max-w-[26rem] text-[1rem] text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
