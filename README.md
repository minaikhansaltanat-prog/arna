# ARNA: лендинг және браузерлік демо (1-кезең)

Нақты уақыттағы дауыстық аударма платформасының жарнамалық беті және сценарийлі демо.
Next.js 16 (статикалық экспорт), TypeScript, Tailwind CSS 4, Motion. Backend пен дерекқор жоқ.

- Он тіл: `ru kk en zh uz ky ko ja hi ar` (араб тілінде толық RTL).
- Жарық/қараңғы тақырып (жүйе баптауын автоматты таниды).
- Мобильде: қатып тұратын header, оң жақта ☰ (ашылғанда ✕), тіл ауыстырғыш ☰-тің сол жағында, көлденең скролл/созылу жоқ.
- Сценарийлі демо: тіл таңдау, дауыс растау, жазу эффектісімен тыңдау, аудио/субтитр ауыстырғышы, фон режимі, автоконспект.
- Пилотқа қатысу формасы: дерекқорсыз (WhatsApp хабарлама жобасы немесе форма коннекторы).
- Оң жақ астында WhatsApp плавающий түймесі (+7 747 167 3817).

## Жылдам бастау

```bash
npm install
npm run dev          # http://localhost:3000  (алдымен тіл тізілімін жаңартады)
npm run build        # статикалық сайт: apps/web/out
npx serve apps/web/out
```

Node 20.9+ қажет. Қаріптер мен суреттер репозиторийде дайын, қосымша жүктеу керек емес.

## Құрылым (ТЗ 7-бөлім)

```
apps/web/                 Next.js қосымшасы (лендинг + демо)
  src/app/[lang]/         әр тіл үшін бет: /ru/ /kk/ /en/ ...
  src/app/(redirect)/     "/" : сақталған немесе браузер тіліне бағыттайды
  src/components/         Header, Hero, PhoneDemo, Features, Cases, Pricing, PilotForm, ...
  public/brand/           логотип (фоны тазаланған), favicon
  public/images/          суреттер (docs/photo-credits.md)
  public/fonts/           өзіміз хосттайтын қаріптер (тілге қарай бөлінген)
packages/i18n/            ru.json kk.json en.json ... ar.json (әр тіл бөлек файл)
content/demo-script.json  демоның үлгі транскрипті (қазақша түпнұсқа + 10 тіл) және автоконспект
scripts/                  құрал-саймандар (төменде)
docs/                     құжаттар
```

## Жаңа тіл қосу (кодты өзгертпей)

1. `packages/i18n/en.json` файлын `xx.json` етіп көшіріп, аударыңыз. `_meta` блогын толтырыңыз
   (`code`, `nativeName`, `dir`: `ltr`/`rtl`, `htmlLang`, `ogLocale`, `welcome`, `font`).
   `font`: `latin`, `cyrillic`, `cjk-sc`, `cjk-jp`, `cjk-kr`, `devanagari`, `arabic`.
2. `content/demo-script.json` ішіне `xx` кілтін қосыңыз (5 жол + 3 тармақ автоконспект).
3. `npm run fonts` (қаріптерді қайта құрады, интернет қажет), `npm run i18n:check`, `npm run build`.

`npm run i18n:check` барлық тілдің құрылымын `en.json`-мен салыстырады, бос жолдарды, ұзын сызықшаны (em-dash) және
демо сценарийінің толықтығын тексереді. Қате болса build тоқтайды.

## Мәтінді өзгерткенде

Мәтін `packages/i18n/*.json` ішінде. Қытай, жапон, корей, хинди, араб қаріптері сайтта қолданылатын таңбаларға ғана
қысқартылған (бет жылдам жүктелуі үшін). Мәтінді өзгертсеңіз: `npm run fonts` қайта іске қосыңыз.
Латын және кирилл қаріптері (Onest, Commissioner) толық, оларға бұл қажет емес.

## Форма: лид жинау

`apps/web/.env.local` (немесе Vercel Environment Variables):

```
NEXT_PUBLIC_LEAD_ENDPOINT=https://...   # Formspree / Web3Forms / Apps Script / webhook (JSON POST)
NEXT_PUBLIC_SITE_URL=https://your-domain.kz
```

- Коннектор көрсетілсе: форма деректерді сонда жібереді, қолданушыға "жіберілді" хабары шығады.
- Көрсетілмесе (немесе коннектор жауап бермесе): WhatsApp-та дайын хабарлама ашылады (+7 747 167 3817), қолданушы
  "Жіберу" батырмасын басады. Бұл жағдайда сайт "жіберілді" демейді, "дайын" дейді (шындыққа сай).
- Соңғы өтінім браузердің `localStorage` ішінде де сақталады (`arna-last-lead`), дерекқор құрылмайды.

## GitHub Pages (https://minaikhansaltanat-prog.github.io/arna/)

Репозиторийде `.github/workflows/pages.yml` бар: әр `main` push-тан кейін сайтты жинап, Pages-ке жариялайды.

**Бір реттік баптау (GitHub-та):** репозиторий **Settings > Pages > Build and deployment > Source: GitHub Actions**.
Әдепкіде "Deploy from a branch" тұрса, GitHub сайтты емес, `README.md` файлын көрсетеді.
Баптаудан кейін **Actions** бетінде "Deploy to GitHub Pages" жұмысын **Re-run** басыңыз (немесе кез келген push жасаңыз).

Pages сайты `/arna/` ішкі жолында тұрады, сондықтан жинау кезінде `NEXT_PUBLIC_BASE_PATH=/arna` беріледі (workflow өздігінен береді).
Форма коннекторын қосу үшін: **Settings > Secrets and variables > Actions > Variables** ішінде `NEXT_PUBLIC_LEAD_ENDPOINT`.

Жергілікті тексеру (Pages-пен бірдей): PowerShell-де
`$env:NEXT_PUBLIC_BASE_PATH='/arna'; npm run build; $env:BASE_PATH='/arna'; node ../serve.mjs` және `http://localhost:3000/arna/`.

## Vercel-ге деплой

1. Репозиторийді GitHub-қа салыңыз (бұл репозиторий).
2. Vercel: **Add New > Project**, репозиторийді таңдаңыз. **Root Directory** өзгертпеңіз (репозиторий түбірі).
   Баптаулар `vercel.json` ішінде дайын: `npm install`, `npm run build`, `apps/web/out`.
3. Қаласаңыз Environment Variables қосыңыз (жоғарыда). **Deploy**.
4. Өз доменіңізді **Settings > Domains** ішінде жалғаңыз, `NEXT_PUBLIC_SITE_URL` мәнін соған қойыңыз.

Жеке деректер жиналмайды, ps.kz бұл кезеңде қажет емес (ТЗ 2.2).

## Құрал-саймандар

| Команда | Не істейді |
| --- | --- |
| `npm run i18n:registry` | `packages/i18n/*.json` тізілімін жаңартады (dev/build алдында өздігінен жүреді) |
| `npm run i18n:check` | аударма толықтығын және ережелерді тексереді |
| `npm run fonts` | тілге қарай қаріп файлдарын қайта құрады |
| `npm run qa` | Puppeteer: 10 тіл x 9 экран өлшемі: көлденең скролл, header, ☰/✕, RTL, қателер |
| `npm run qa:demo` | демо ағыны (D-01...D-07), форма, WhatsApp түймесі, тақырып, тіл анықтау |
| `npm run check:case` | импорттардың әріп регистрін тексереді (Linux CI үшін) |
| `npm run qa:a11y` | axe-core: WCAG 2 A/AA (контраст, ARIA), екі тақырып, десктоп және мобиль |
| `python scripts/process-logo.py <Logo> <out>` | логотиптің "шахматты" фонын тазалап, мөлдір PNG/WebP жасайды |

`npm run qa*` үшін алдымен `npm run build` және статикалық серверді (мысалы `npx serve apps/web/out -l 3000`) іске қосыңыз.

## Растау қажет жерлер

- Аударма: барлық тіл мұқият дайындалған, бірақ ТЗ 9-бөліміне сай әр тілде ана тілді тексеруші қарап шыққаны жөн
  (әсіресе қазақша грамматика, демо транскрипті, араб RTL).
- Тарифтер (49 000 / 190 000 ₸ / келісім бойынша) және "< 3 с" кідіріс мақсаты: ТЗ-ның толық нұсқасындағы
  мәнге сәйкестендіріңіз. Қазір олар үлгі ретінде белгіленген (`packages/i18n/*.json`, `pricing` және `hero.stats`).
- Суреттер Pexels-тен (тегін лицензия), `docs/photo-credits.md`.
