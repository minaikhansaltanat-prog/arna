# TZ coverage (Lending + demo, phase 1)

Source: `4_TZ_Lending_Demo.pdf`. Put the PDF next to this file; the full TZ (file 3) is the parent document.

| ID | Requirement | Where |
| --- | --- | --- |
| L-01 | Hero: name, short text, key numbers, two CTAs | `components/Hero.tsx` |
| L-02 | Feature cards: voice, translation, auto-summary, content, referral, background | `components/Features.tsx` |
| L-03 | Use cases: university, forum, wedding, company, trainer | `components/Cases.tsx` |
| L-04 | How it works, four numbered steps | `components/How.tsx`, `HowSteps.tsx` |
| L-05 | Three sample plans with price and terms, link to full pricing | `components/Pricing.tsx` |
| L-06 | Pilot sign-up form | `components/Pilot.tsx`, `PilotForm.tsx` |
| L-07 | Language switcher in the header | `components/LanguageSwitcher.tsx` |
| L-08 | Light and dark theme, follows the system | `app/globals.css`, `ThemeToggle.tsx`, inline script in `[lang]/layout.tsx` |
| D-01 | Language screen, moves on after choosing | `PhoneDemo.tsx` (`LangStep`) |
| D-02 | Voice check: waveform and "is this the voice?" | `PhoneDemo.tsx` (`VoiceStep`), `WaveCanvas.tsx` |
| D-03 | Original and translation appear line by line with a typing effect | `PhoneDemo.tsx` (`LiveStep`) |
| D-04 | Audio and subtitle switches hide their block | `PhoneDemo.tsx` |
| D-05 | Background mode: dimmed screen, "audio continues", tap to restore | `PhoneDemo.tsx`, `.dim-overlay` |
| D-06 | Auto-summary card with three points matching the transcript | `PhoneDemo.tsx` (`SummaryStep`) |
| D-07 | Restart returns to step one | restart button in the phone header and in the summary |
| D-08 | Ready transcript (4 to 5 sentences) for each of the ten languages | `content/demo-script.json` |
| D-09 | Demo is clearly marked as scripted | badge inside the phone (always visible) and the notice beside it |
| I-01 | All interface text from dictionaries | `packages/i18n/*.json`, enforced by `npm run i18n:check` |
| I-02 | Browser language detection with manual override | `app/(redirect)/page.tsx`, language saved in `localStorage` |
| I-03 | RTL for Arabic | `dir="rtl"` on `<html>`, logical CSS properties throughout |
| I-04 | Only the needed font per language | `scripts/build-fonts.mjs`, `lib/fonts.ts`, `fonts.manifest.json` |
| C-01 | Fields: name, contact, event type; required-field errors | `PilotForm.tsx` |
| C-02 | Message draft or light connector, no database | `PilotForm.tsx`, `lib/site.ts` (`LEAD_ENDPOINT`) |
| C-03 | Success is shown | `PilotForm.tsx` (two honest variants: sent / draft prepared) |

Acceptance scenarios 1 to 6 (TZ section 8) are covered by `scripts/qa-layout.mjs` (language switch, RTL, overflow on phones)
and by the demo flow test described in the README.

Extra, from the client's brief: fixed header, phone menu with a morphing burger/X, language button left of the burger,
floating WhatsApp button with gold and green waves, Kazakh-safe type, brand logo with the baked-in checkerboard removed.
