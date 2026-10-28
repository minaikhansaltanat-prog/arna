/* Logo-shaped voice wave as a thin SVG path: calm ends, ripples that grow, one dominant peak.
   Offsets are in units of the peak width, so the shape stays recognisably the ARNA emblem at any size. */
function arnaWave({ w, cy, cx = 0.5, up = 170, s = 1, ripple = 0, murmur = 0 }) {
  const taps = [
    [0, 1.0, 0.0105],
    [-0.032, -0.5, 0.009], [0.032, -0.56, 0.009],
    [-0.06, 0.36, 0.008], [0.06, 0.4, 0.008],
    [-0.085, -0.24, 0.007], [0.085, -0.27, 0.007],
    [-0.108, 0.16, 0.006], [0.108, 0.18, 0.006],
    [-0.128, -0.1, 0.005], [0.128, -0.11, 0.005],
  ];
  let d = "";
  for (let px = 0; px <= w; px += 1) {
    const x = px / w;
    let f = 0;
    for (const [o, a, sg] of taps) f += a * Math.exp(-(((x - cx - o * s) / (sg * s)) ** 2));
    if (ripple) f += ripple * Math.sin(px / 9) * Math.exp(-(((x - cx) / (0.3 * s)) ** 2)) * 0.12;
    // murmur: a faint audio-like tremor along the whole line, so the calm parts never read as a flat ECG
    const env = Math.min(1, x / 0.18) * Math.min(1, (1 - x) / 0.18);
    const y = cy - f * up + murmur * env * (Math.sin(px / 10.5) * 0.55 + Math.sin(px / 23 + 1.3) * 0.45);
    d += (px ? "L" : "M") + px + " " + y.toFixed(1);
  }
  return d;
}
function y_at(d, px) { // y of the path at a given x, for placing nodes on the line
  const m = d.split(/[ML]/).filter(Boolean)[Math.round(px)];
  return m ? parseFloat(m.split(" ")[1]) : 0;
}
