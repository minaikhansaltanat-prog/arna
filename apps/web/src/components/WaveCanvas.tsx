"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * The brand signal: one continuous, unbroken "liquid gold" tube shaped like a voice waveform
 * (irregular and organic, calm at both ends, one dominant peak), like the ARNA logo.
 * Rendered on a 2D canvas with stacked strokes (shadow, dark rim, amber body, light core, specular line)
 * so it reads as a glossy wire without WebGL. Pauses off-screen and when the tab is hidden;
 * draws a single still frame under prefers-reduced-motion.
 */
type Props = {
  className?: string;
  /** overall height of the wave relative to the canvas (0..1.4) */
  amp?: number;
  /** animation speed multiplier */
  speed?: number;
  /** tube thickness as a fraction of canvas height */
  weight?: number;
  /** live level (0..1) for the voice-check screen; read every frame, never causes a re-render */
  levelRef?: MutableRefObject<number>;
  /** shifts the pattern so two canvases never look identical */
  seed?: number;
  /** slightly wider, lower-contrast glow pass */
  glow?: boolean;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function WaveCanvas({ className, amp = 1, speed = 1, weight = 0.075, levelRef, seed = 0, glow = true }: Props) {
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
    let lastT = 1.4 + seed;
    const start = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const shape = (x: number, t: number, level: number) => {
      const edge = smooth(0, 0.14, x) * smooth(0, 0.14, 1 - x);
      const centre = Math.exp(-(((x - 0.5) / 0.2) ** 2));
      const env = 0.1 + 0.9 * centre;
      const ripples =
        Math.sin(x * 27 + t * 1.5 + seed) * 0.52 +
        Math.sin(x * 43 - t * 2.1 + 1.7 + seed * 2) * 0.3 +
        Math.sin(x * 71 + t * 2.9 + 0.4) * 0.14;
      const breathe = 0.78 + 0.22 * Math.sin(t * 0.85 + x * 5 + seed);
      const peak = -Math.exp(-(((x - 0.5) / 0.032) ** 2)) * (0.92 + 0.08 * Math.sin(t * 1.3));
      const side = -0.42 * Math.exp(-(((x - 0.36) / 0.022) ** 2)) - 0.36 * Math.exp(-(((x - 0.64) / 0.022) ** 2));
      return (ripples * env * breathe * 0.62 + peak + side * breathe) * edge * amp * (0.35 + 0.65 * level);
    };

    const draw = (t: number) => {
      if (!w || !h) return;
      const level = levelRef ? levelRef.current : 1;
      const n = Math.max(90, Math.round(w / 3.2));
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const x = i / n;
        pts.push([x * w, h / 2 + shape(x, t, level) * h * 0.46]);
      }
      const th = Math.max(5, Math.min(26, h * weight));
      const trace = (dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i][0] + pts[i + 1][0]) / 2 + dx;
          const my = (pts[i][1] + pts[i + 1][1]) / 2 + dy;
          ctx.quadraticCurveTo(pts[i][0] + dx, pts[i][1] + dy, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1][0] + dx, pts[pts.length - 1][1] + dy);
      };
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (glow) {
        trace(0, 0);
        ctx.lineWidth = th * 2.6;
        ctx.strokeStyle = "rgba(242,179,61,0.10)";
        ctx.stroke();
      }
      // dark amber rim with a soft cast shadow
      ctx.save();
      ctx.shadowColor = "rgba(2,14,18,0.5)";
      ctx.shadowBlur = th * 1.3;
      ctx.shadowOffsetY = th * 0.75;
      trace(0, 0);
      ctx.lineWidth = th;
      ctx.strokeStyle = "#a9660a";
      ctx.stroke();
      ctx.restore();
      // amber body
      trace(-th * 0.02, -th * 0.05);
      ctx.lineWidth = th * 0.8;
      ctx.strokeStyle = "#e39a22";
      ctx.stroke();
      // light core
      trace(-th * 0.05, -th * 0.12);
      ctx.lineWidth = th * 0.5;
      ctx.strokeStyle = "#f7c243";
      ctx.stroke();
      // specular highlight
      trace(-th * 0.1, -th * 0.22);
      ctx.lineWidth = Math.max(1.5, th * 0.16);
      ctx.strokeStyle = "rgba(255,244,205,0.92)";
      ctx.stroke();
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(lastT);
    };

    const loop = (now: number) => {
      if (!running) return;
      lastT = ((now - start) / 1000) * speed + seed;
      draw(lastT);
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

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? play() : pause();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);
    resize();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [amp, speed, weight, levelRef, seed, glow]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
