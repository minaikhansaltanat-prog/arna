/**
 * The ARNA voice wave as plain math: a calm murmur, ripples that grow, one dominant peak (the logo's shape).
 * Used by the canvas (animated) and by the static SVG rules, so every wave on the site is the same drawing.
 * Offsets and widths are in "peak units" (1 unit = u px), so the proportions hold at any size.
 */
type Tap = [offset: number, amp: number, sigma: number];

const TAPS: Tap[] = [
  [0, 1, 1],
  [-3.05, -0.5, 0.86],
  [3.05, -0.56, 0.86],
  [-5.7, 0.36, 0.76],
  [5.7, 0.4, 0.76],
  [-8.1, -0.24, 0.67],
  [8.1, -0.27, 0.67],
  [-10.3, 0.16, 0.57],
  [10.3, 0.18, 0.57],
  [-12.2, -0.1, 0.48],
  [12.2, -0.11, 0.48],
];

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Shape at pixel `px`: +1 at the top of the main peak, about -0.5 in the dips beside it. */
export function voiceShape(px: number, cx: number, u: number, swell = 1, wobble = 0, t = 0): number {
  let f = 0;
  for (let i = 0; i < TAPS.length; i++) {
    const [o, a, s] = TAPS[i];
    const d = (px - cx - o * u) / (s * u);
    if (d > 4 || d < -4) continue;
    const k = i === 0 ? swell : 1 + wobble * Math.sin(t * 1.9 + o);
    f += a * k * Math.exp(-d * d);
  }
  return f;
}

/** A faint tremor along the whole line, so the calm parts never read as a flat line (or a heartbeat monitor). */
export function murmur(px: number, w: number, t: number, seed: number): number {
  const x = px / w;
  const edge = 0.5 + 0.5 * smooth(0, 0.16, x) * smooth(0, 0.16, 1 - x);
  return edge * (Math.sin(px / 10.5 - t * 2.2 + seed) * 0.55 + Math.sin(px / 23 + t * 1.3 + seed * 1.7 + 1.3) * 0.45);
}

/** Unit width for a given canvas width (peak cluster about 25 units wide). */
export const unitFor = (w: number, spread = 1) => Math.min(20, Math.max(4.5, w * 0.0105)) * spread;

/** Static SVG path of the wave, for decorative rules that do not animate. `cy` is the centre line. */
export function wavePath(w: number, cy: number, up: number, peak = 0.5, tremor = 2.2, seed = 0): string {
  const u = unitFor(w);
  const cx = peak * w;
  let d = "";
  for (let px = 0; px <= w; px += 2) {
    const y = cy - voiceShape(px, cx, u) * up + murmur(px, w, 0, seed) * tremor;
    d += `${px ? "L" : "M"}${px} ${y.toFixed(1)}`;
  }
  return d;
}
