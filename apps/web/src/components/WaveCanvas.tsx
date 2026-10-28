"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { murmur, unitFor, voiceShape } from "@/lib/wave";

/**
 * The brand signal: one thin, continuous gold line shaped like the ARNA voice (a calm tremor, ripples that grow,
 * one dominant peak). It is never a straight line: a faint tremor runs along the whole width.
 * Drawn on a 2D canvas (a hairline plus a soft halo). Pauses off-screen and when the tab is hidden;
 * draws one still frame under prefers-reduced-motion. The colour comes from CSS (`--wave`), so both themes work.
 */
type Props = {
  className?: string;
  /** height of the main peak relative to the available space (0..1.2) */
  amp?: number;
  /** animation speed multiplier */
  speed?: number;
  /** line width in CSS px */
  weight?: number;
  /** live level (0..1), read every frame, never causes a re-render (the voice check and the hero while scrolling) */
  levelRef?: MutableRefObject<number>;
  /** shifts the tremor so two canvases never look identical */
  seed?: number;
  /** soft halo under the line */
  glow?: boolean;
  /** vertical position of the centre line (0..1 of the height); the peak rises above it */
  baseline?: number;
  /** horizontal position of the main peak (0..1 of the width); `peakNarrow` is used below 700px */
  peak?: number;
  peakNarrow?: number;
  /** widens or narrows the peak cluster */
  spread?: number;
  /** let the line fade at both ends, never to nothing */
  fade?: boolean;
};

const parseRgb = (s: string): [number, number, number] => {
  const m = s.match(/\d+(\.\d+)?/g);
  return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : [242, 179, 61];
};

export function WaveCanvas({
  className,
  amp = 0.9,
  speed = 1,
  weight = 1.6,
  levelRef,
  seed = 0,
  glow = true,
  baseline = 0.58,
  peak = 0.5,
  peakNarrow,
  spread = 1,
  fade = true,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    let running = false;
    let lastDraw = 0;
    let lastT = 1.1 + seed;
    let rgb: [number, number, number] = [242, 179, 61];
    let grad: CanvasGradient | null = null;
    const start = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = () => {
      rgb = parseRgb(getComputedStyle(canvas).color);
      grad = null;
    };

    const draw = (t: number) => {
      if (!w || !h) return;
      const level = levelRef ? levelRef.current : 1;
      const cy = h * baseline;
      const A = cy * 0.94 * amp * (0.32 + 0.68 * level);
      const u = unitFor(w, spread);
      const cx = (w < 700 && peakNarrow != null ? peakNarrow : peak) * w;
      const tremor = Math.max(1.6, Math.min(6, h * 0.022)) * (0.55 + 0.45 * level);
      const swell = 0.93 + 0.07 * Math.sin(t * 1.3);

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const step = w > 1500 ? 2.5 : 2;
      ctx.beginPath();
      for (let px = 0; px <= w + step; px += step) {
        const x = Math.min(px, w);
        const y = cy - voiceShape(x, cx, u, swell, 0.1, t) * A + murmur(x, w, t, seed) * tremor;
        if (px === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (!grad) {
        grad = ctx.createLinearGradient(0, 0, w, 0);
        const c = (a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
        if (fade) {
          grad.addColorStop(0, c(0.3));
          grad.addColorStop(0.1, c(1));
          grad.addColorStop(0.9, c(1));
          grad.addColorStop(1, c(0.3));
        } else {
          grad.addColorStop(0, c(1));
          grad.addColorStop(1, c(1));
        }
      }
      if (glow) {
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.lineWidth = weight * 4.5;
        ctx.strokeStyle = grad;
        ctx.stroke();
        ctx.restore();
      }
      ctx.lineWidth = weight;
      ctx.strokeStyle = grad;
      ctx.stroke();
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, r.width > 1600 ? 1.25 : 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grad = null;
      draw(lastT);
    };

    const loop = (now: number) => {
      if (!running) return;
      if (now - lastDraw >= 24) {
        lastDraw = now;
        lastT = ((now - start) / 1000) * speed + seed;
        draw(lastT);
      }
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (reduce || running || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    paint();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
      else pause();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);
    // theme switch: new colour, repaint once even when paused
    const mo = new MutationObserver(() => {
      paint();
      draw(lastT);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    resize();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [amp, speed, weight, levelRef, seed, glow, baseline, peak, peakNarrow, spread, fade]);

  return <canvas ref={ref} className={`wave-canvas ${className ?? ""}`} aria-hidden="true" />;
}
