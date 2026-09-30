"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { withBase } from "@/lib/site";

export type Chip = { code: string; text: string; dir: "ltr" | "rtl"; htmlLang: string };

/** Slots are inset on phones (nothing may leave the viewport) and pushed outward on wide screens. */
const SLOTS = [
  "top-[4%] start-0 md:-start-[4%]",
  "top-[20%] end-0 md:-end-[6%]",
  "top-[50%] start-0 md:-start-[8%]",
  "bottom-[14%] end-[2%] md:-end-[2%]",
  "bottom-[2%] start-[16%]",
  "top-[0%] end-[18%] hidden sm:flex",
];

/**
 * The real ARNA emblem, tilting towards the pointer on desktop (transform only, via motion values,
 * never React state), ringed by sound ripples and greeting bubbles in other languages.
 */
export function HeroVisual({ chips, alt }: { chips: Chip[]; alt: string }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 120, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [12, -12]);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !box.current) return;
    const r = box.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={box}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto aspect-square w-full max-w-[400px] select-none lg:max-w-[520px]"
    >
      {/* glow */}
      <div
        aria-hidden
        className="anim-drift absolute inset-[6%] rounded-full blur-2xl"
        style={{ background: "radial-gradient(closest-side, var(--glow), transparent 72%)" }}
      />
      {/* sound ripples */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="ripple absolute inset-[16%] rounded-full border border-gold/50"
          style={{ animationDelay: `${i * 1.6}s` }}
        />
      ))}

      <m.div
        style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }}
        className="absolute inset-[19%]"
      >
        <img
          src={withBase("/brand/emblem-512.png")}
          width={512}
          height={512}
          alt={alt}
          fetchPriority="high"
          draggable={false}
          className="emblem-float size-full object-contain"
          style={{ filter: "drop-shadow(0 34px 34px rgba(3,18,22,0.5)) drop-shadow(0 10px 18px rgba(216,155,42,0.22))" }}
        />
      </m.div>

      {chips.map((c, i) => (
        <span
          key={c.code}
          className={`chip chip-float absolute ${SLOTS[i] ?? ""}`}
          style={{ ["--fd-delay" as string]: `${-i * 1.15}s` }}
          lang={c.htmlLang}
          dir={c.dir}
        >
          <span data-names={c.code} className="chip__text">
            {c.text}
          </span>
          <span className="chip__code" aria-hidden>
            {c.code}
          </span>
        </span>
      ))}
    </div>
  );
}
