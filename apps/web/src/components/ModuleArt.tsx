import { wavePath } from "@/lib/wave";

/**
 * One thin-line drawing per module, all in the same gold hairline as the wave (colour from `currentColor`).
 * 0 Live: a voice reaches many listeners. 1 Network: people connecting. 2 Video: a screen with a caption line.
 * 3 Read: text lines becoming a voice. 4 Talk: two voices answering each other.
 */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const NODES: [number, number][] = [
  [86, 96], [196, 58], [326, 104], [440, 70], [140, 196], [286, 208], [414, 214], [236, 278], [66, 262],
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 5], [5, 6], [4, 8], [5, 7], [7, 6], [8, 7],
];
const HOT_NODES = [1, 5];
const HOT_EDGES = [5];

export function ModuleArt({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 520 320" className="mod-art" aria-hidden focusable="false">
      {index === 0 && (
        <g {...P}>
          <circle cx="44" cy="160" r="6" fill="currentColor" />
          <circle cx="44" cy="160" r="17" opacity=".4" />
          <g transform="translate(74 0)">
            <path d={wavePath(250, 160, 84, 0.5, 2.4, 1)} strokeWidth="1.8" />
          </g>
          {[70, 160, 250].map((y) => (
            <g key={y}>
              <path d={`M324 160 C 390 160, 400 ${y}, 456 ${y}`} opacity=".55" strokeDasharray="2 5" />
              <circle cx="470" cy={y} r="6" fill="currentColor" />
              <circle cx="470" cy={y} r="15" opacity=".4" />
            </g>
          ))}
        </g>
      )}

      {index === 1 && (
        <g {...P}>
          {EDGES.map(([a, b], i) => (
            <path key={i} d={`M${NODES[a][0]} ${NODES[a][1]} L${NODES[b][0]} ${NODES[b][1]}`} opacity={HOT_EDGES.includes(i) ? 1 : 0.34} strokeWidth={HOT_EDGES.includes(i) ? 2 : 1.3} />
          ))}
          {NODES.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={HOT_NODES.includes(i) ? 9 : 5.5} fill={HOT_NODES.includes(i) ? "currentColor" : "var(--sbg, var(--bg))"} />
              {HOT_NODES.includes(i) && <circle cx={x} cy={y} r="20" opacity=".35" />}
            </g>
          ))}
        </g>
      )}

      {index === 2 && (
        <g {...P}>
          <rect x="80" y="36" width="360" height="206" rx="20" />
          <path d="M240 112 L240 166 L288 139 Z" fill="currentColor" />
          <path d="M112 216 L408 216" opacity=".35" />
          <path d="M112 216 L262 216" strokeWidth="2.4" />
          <circle cx="262" cy="216" r="5" fill="currentColor" />
          <path d="M150 274 L370 274" strokeWidth="5" opacity=".6" />
          <path d="M196 296 L324 296" strokeWidth="5" opacity=".4" />
        </g>
      )}

      {index === 3 && (
        <g {...P}>
          {[
            [48, 190],
            [48, 150],
            [48, 200],
            [48, 118],
            [48, 170],
          ].map(([x, len], i) => (
            <path key={i} d={`M${x} ${70 + i * 44} L${x + len} ${70 + i * 44}`} strokeWidth="3" opacity=".55" />
          ))}
          {[70, 114, 158, 202, 246].map((y, i) => (
            <path key={y} d={`M${[238, 198, 248, 166, 218][i]} ${y} C 270 ${y}, 262 160, 294 160`} opacity=".4" strokeDasharray="2 5" />
          ))}
          <g transform="translate(290 0)">
            <path d={wavePath(220, 160, 78, 0.42, 2.4, 2)} strokeWidth="1.8" />
          </g>
        </g>
      )}

      {index === 4 && (
        <g {...P}>
          <path d="M70 40 H232 A22 22 0 0 1 254 62 V118 A22 22 0 0 1 232 140 H104 L76 164 V140 H70 A22 22 0 0 1 48 118 V62 A22 22 0 0 1 70 40 Z" />
          <g transform="translate(60 0)">
            <path d={wavePath(180, 90, 26, 0.5, 1.4, 3)} strokeWidth="1.6" />
          </g>
          <path d="M450 180 H288 A22 22 0 0 0 266 202 V258 A22 22 0 0 0 288 280 H416 L444 304 V280 H450 A22 22 0 0 0 472 258 V202 A22 22 0 0 0 450 180 Z" />
          <g transform="translate(280 0)">
            <path d={wavePath(180, 230, 26, 0.5, 1.4, 5)} strokeWidth="1.6" />
          </g>
          <path d="M254 96 C 330 96, 190 232, 266 232" opacity=".4" strokeDasharray="2 5" />
        </g>
      )}
    </svg>
  );
}
