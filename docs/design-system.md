# ARNA design system

Direction: **liquid gold on deep petrol teal**. The brand's 3D glossy waveform tube is the one recurring signal:
logo, hero, how-it-works rail, voice check, feature card. Everything else stays quiet so the gold reads as the voice.

## Colour (only two brand colours plus white)

| Token | Dark (brand home) | Light |
| --- | --- | --- |
| `--bg` base | `#0E3B45` | `#F1F6F5` (cool mint-white, not cream) |
| `--bg-2` recessed | `#0A2F38` | `#E4EDEC` |
| `--surface` elevated | `#134754` | `#FAFDFC` |
| `--surface-2` floating | `#19596A` | `#FDFEFE` |
| `--fg` | `#EAF3F2` | `#0B2E36` |
| `--muted` | `#A9C6CA` | `#465F65` |
| gold fill | `#F2B33D` to `#D89B2A` | `#E7A82F` |
| gold as text | `#F2B33D` | `#8A5608` (5:1 contrast) |
| WhatsApp | `#25D366`, only on the WhatsApp button and its rings | same |

Layers: base > elevated > floating. Shadows are layered and tinted (teal in dark, petrol at low opacity in light),
never flat black. A fixed, click-through grain layer adds texture.

## Type

- Display: **Onest** 800, tracking `-0.035em`. Body: **Commissioner**, line-height 1.7.
- Both cover Kazakh `ә ғ қ ң ө ұ ү һ і` and Uzbek `oʻ gʻ` (verified against the font glyph maps).
- Non-Latin scripts use Noto (SC, JP, KR, Devanagari, Arabic/Kufi), cut down to the characters the site uses.
  They load only for their language (TZ 3.1). No negative tracking and no uppercase for those scripts.
- The script stack is chosen by `data-font` (`html` carries it, and any element can override it, which the demo does
  for the translated text).

## Shape and spacing

- Interactive = pill, containers = 24 to 28px, inputs = 16px. One rule, used everywhere.
- Touch targets 44px or more; inputs are 16px text (no iOS zoom).
- Section rhythm: `clamp(72px, 11vw, 136px)`; content width 1240px; side gutter `clamp(16px, 4.2vw, 32px)`.

## Motion (only `transform` and `opacity`)

Reveal on scroll (below the fold only), tilting emblem, rail that fills with scroll progress, step transitions in the
demo, floating language bubbles, WhatsApp rings and buzz. Everything collapses under `prefers-reduced-motion`.
Canvas waveforms pause when off-screen or when the tab is hidden.

## Mobile stability rules (why the page cannot drift or stretch)

- `html, body { overflow-x: clip; overscroll-behavior: none; touch-action: pan-y pinch-zoom }`.
- Every grid has an explicit `minmax(0, 1fr)` column, so content can never widen a column.
- Decorative glows and canvases live inside `overflow: clip` sections; reveal animations never move sideways.
- Header is `position: fixed`; the mobile menu is a sibling of the header (a `backdrop-filter` parent would trap it).
- The WhatsApp wrapper clips its rings, so the page cannot be widened by the animation.
- `npm run qa` checks all of this for every language and seven screen sizes.

## Image treatment

Teal `multiply` tint plus a bottom gradient on every photo, so separate stock photos read as one set.
