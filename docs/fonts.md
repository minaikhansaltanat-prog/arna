# Fonts (TZ 3.1)

The site mixes Cyrillic, Latin, Chinese, Japanese, Korean, Devanagari and Arabic. No single font covers all of them,
so each script gets its own file and only the current language's files are fetched.

## Kazakh and Uzbek safety check

Glyph maps of the candidate fonts were read with fontTools before choosing. Kazakh needs `ә ғ қ ң ө ұ ү һ і`
(upper and lower case); Uzbek Latin needs `ʻ` (U+02BB, as in `oʻ`, `gʻ`).

| Font | Kazakh letters | Uzbek `ʻ` |
| --- | --- | --- |
| **Onest** (display, chosen) | all present | present |
| **Commissioner** (body, chosen) | all present | present |
| Montserrat, Raleway, Nunito, Noto Sans | all present | present |
| Golos Text, Rubik, Geologica | all present | missing |
| Manrope | `ә ғ қ ң ұ` missing | missing |
| Unbounded, Wix Madefor Display, Playfair Display, Jost | several or all missing | varies |

## What loads when

| Language | Files on first paint |
| --- | --- |
| ru | Onest and Commissioner: `cyrillic` + `latin` |
| kk, ky | the same plus `cyrillic-ext` (holds `ә ғ қ ң ө ұ ү һ`) |
| en, uz | `latin` |
| zh, ja, ko | one Noto Sans subset (56 to 136 KB) with only the characters used in that language |
| hi | Noto Sans Devanagari subset + Onest `latin` |
| ar | Noto Sans Arabic + Noto Kufi Arabic subsets + Onest `latin` |

The language switcher and the greeting bubbles show all ten native names on every page, so each non-Latin
script also has a tiny "ARNA Names" subset (3 to 28 KB) that only loads when those names are on screen.
The demo's translated text uses the listener's language font; it is fetched only when that language is chosen.

Preload hints per language are generated into `apps/web/src/lib/fonts.manifest.json` and applied in
`app/[lang]/layout.tsx` with `ReactDOM.preload`.

## Changing copy

CJK, Devanagari and Arabic files contain only the characters present in the current copy. After editing
`packages/i18n/*.json` or `content/demo-script.json`, run `npm run fonts` (needs internet) and commit the result.
Text typed by visitors into the form falls back to the system font for any character outside the subset.
