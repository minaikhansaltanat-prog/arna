# ARNA design system

Direction: **one line**. The brand's voice wave, drawn as one thin gold line, is the only recurring signal. It crosses the
hero edge to edge, hangs the sections on a thread, runs along the steps and the five modules, and enters the language
strands from the screen edge. Everything else stays quiet. Slogan: "A world without language barriers. Let's grow together."
(`hero.title` in every dictionary).

The logo files in `public/brand/` are never changed; the design is built around them.

## Colour (only two brand colours plus white)

| Token | Dark (brand home) | Light |
| --- | --- | --- |
| `--bg` base | `#0E3B45` | `#F1F6F5` (cool mint-white, not cream) |
| `--bg-2` recessed band | `#0A2F38` | `#E4EDEC` |
| `--block-bg` full-width colour block (demo, pilot) | `#072730` (deeper than the bands) | `#0E3B45` (brand petrol) |
| `--surface` / `--surface-2` | `#134754` / `#19596A` | `#FAFDFC` / `#FDFEFE` |
| `--fg` | `#EAF3F2` | `#0B2E36` |
| `--muted` | `#A9C6CA` | `#465F65` |
| gold fill | `#F2B33D` | `#E7A82F` |
| gold as text | `#F2B33D` | `#8A5608` (5:1) |
| gold as large display text, `--wave` | `#F2B33D` | `#B8780C` (3.3:1, large text and the wave only) |
| WhatsApp | `#25D366`, only on the WhatsApp button and its rings | same |

Flat colour: no gradient fills on buttons, cards or text. The only gradients are one soft glow behind the wave and the
photo scrims. `.dark-scope` re-applies the dark tokens inside a block, so the demo and pilot blocks stay light-on-dark in
both themes. Tokens that depend on theme colours (`--strand`) are declared inside the block that uses them.

## Type

- Display: **Onest** 800, tracking `-0.035em`. Body: **Commissioner**, line-height 1.7. Both are self-hosted.
- Both cover Kazakh `ә ғ қ ң ө ұ ү һ і` and Uzbek `oʻ gʻ`. CJK, Devanagari and Arabic use Noto subsets cut to the
  characters the site uses (`npm run fonts` after editing copy). The slogan appears in every language (hero caption,
  language strands), so each script's "ARNA Names" subset also contains every language's slogan.
- Loading: only Onest (the slogan) is preloaded; Commissioner loads on demand (`font-display: swap`), so the first paint is
  not queued behind it. The "ARNA Names" subsets are one static weight (600), a few KB each. The header logo is
  `brand/wordmark-sm.webp` (a resized copy of the wordmark, the original file is untouched).
- The hero entrance moves text with `transform` only (a fade from opacity 0 delays the largest contentful paint).
- The hero slogan sizes itself from its own length: `font-size = container width / (characters x script glyph width)`,
  capped at 5.25rem and at 11% of the screen height (`--hero-chars`, `--hero-cw`). Each line stays on one line when the
  screen allows; phones use larger type and wrap.
- Text column: `--measure: 49ch` (about 70 characters a line; a "0" is wider than an average letter, so `62ch` held 80 to
  100). `npm run qa` fails any paragraph line above 75 characters.

## Layout: wide screens

- Content width `--content-max: clamp(1240px, 92vw, 1600px)`: 1240 up to 1348px screens, about 1325 at 1440, 1600 from
  1740px. Side gutter `--gutter: clamp(16px, 4.2vw, 32px)`.
- From 1920px the root font grows (112.5%, and 125% from 2400px), so the whole layout scales and 1920/2560 read like 1440.
- **Full-bleed:** the hero (100% x 100svh), the wave, the module line, the steps rail, colour blocks, section bands, the
  speaker's wave in the language strands and the stage photo run to the screen edge. `--edge` is the distance from the
  screen edge to the content edge; negative margins of `--edge` push an element out to the screen.
- Text and cards stay inside `.wrap`. Section rhythm `clamp(72px, 11vw, 136px)`.
- Band order (alternating): hero base, steps base, modules recessed, **demo block**, audiences base, pricing recessed,
  **pilot block**, footer recessed.

## The signal

- `WaveCanvas`: one hairline (1.6 to 2px) with a soft halo, shaped like the logo (a calm tremor, ripples that grow, one
  dominant peak). It is **never straight**: a tremor runs along the whole width, also at the ends. Props: `amp`, `speed`,
  `weight` (px), `levelRef` (live level, no re-render), `peak`/`peakNarrow` (position), `spread`, `baseline`, `seed`.
  Colour comes from `--wave`. Pauses off-screen and in a hidden tab; one still frame under reduced motion.
- The hero wave reacts to scroll speed (a ref, not state); the language strands change the speaker's wave per language
  (seed, speed, spread); the voice check in the demo drives it with the microphone-like level.
- `WaveRule`: the same drawing as a static, full-width SVG rule (before the pilot block, in the footer, over the photo).
- `Thread`: a vertical hairline left of the content that fills with gold as the page is read; each section hangs a node
  on it (`SectionNode`, level with the heading).
- Module drawings (`ModuleArt`): one thin-line drawing per module in the same hairline.

## Components

- Buttons: pill, 48px (44px small), flat gold primary, hairline ghost. Hover is an overlay whose opacity fades in.
- Tabs (modules): five stations on a line, roving tabindex, arrow keys (mirrored in RTL), Home/End; every panel is in the
  HTML. The hero's module line opens a module through the `arna:module` event.
- Language strands: ten hairlines from the ARNA mark, one button per language (`aria-pressed`), shared choice with the
  phone (`externalPick` / `onTargetChange` on `PhoneDemo`). Rows are at least 44px.
- Audience timeline: a hairline with nodes, four rows. Pricing: flat cards, the recommended one has a gold border.
- Interactive = pill, containers = 24 to 28px, inputs = 16px. Touch targets 44px or more; inputs are 16px text.

## Motion (only `transform` and `opacity`)

Hero text rises once on load, the hero caption cross-fades through the languages, section content reveals once on scroll
(below the fold only), the thread, the steps rail and the module line fill with scroll progress (`scaleX`/`scaleY`),
`WaveRule` opens from the centre once, tab panels pop in. Under `prefers-reduced-motion` everything settles: the wave is
a still frame, the thread and rails are full, the caption stays on one language, nothing loops.

## Mobile stability rules (why the page cannot drift or stretch)

- `html, body { overflow-x: clip; overscroll-behavior: none; touch-action: pan-y pinch-zoom }`; every section clips its
  own x-overflow, every grid has an explicit `minmax(0, 1fr)` column.
- Header is `position: fixed`; the mobile menu is a sibling of the header. The WhatsApp wrapper clips its rings.
- The hero keeps 96px free at its bottom so the module line never sits under the floating WhatsApp button.
- `npm run qa` checks overflow, the first screen (hero full-bleed, wave edge to edge and visible, main action on screen),
  band widths, content width, line length and the header for every language at eleven sizes (320 to 2560px).

## Image treatment

One real photo (a speaker on stage, `images/stage.webp`) with a petrol multiply tint and a bottom scrim, in "Who it is
for". No other stock photos.
