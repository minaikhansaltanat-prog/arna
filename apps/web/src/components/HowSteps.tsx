"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useReducedMotion, useScroll } from "motion/react";

/**
 * The four steps. One hairline runs from edge to edge of the screen (vertical inside the content on phones) and
 * fills with gold as the list scrolls into view: the signal travels from the stage to the phone.
 * Motion values drive transform only, so nothing re-renders while scrolling.
 */
export function HowSteps({ steps }: { steps: { title: string; text: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 78%", "end 58%"] });
  const p = reduce ? 1 : scrollYProgress;

  return (
    <div ref={ref} className="how-stage">
      <span aria-hidden className="how-rail how-rail--h" />
      <m.span aria-hidden className="how-fill how-fill--h" style={{ scaleX: p }} />

      <ol className="wrap how-steps">
        <span aria-hidden className="how-rail how-rail--v" />
        <m.span aria-hidden className="how-fill how-fill--v" style={{ scaleY: p }} />
        {steps.map((s, i) => (
          <li key={s.title} className="how-step">
            <span className="how-node" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="how-step__title">{s.title}</h3>
            <p className="how-step__text">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
