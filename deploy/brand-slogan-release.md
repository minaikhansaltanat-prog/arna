# Шығару: жаңа логотип пен ұран (arnavoice.com)

Бұл нұсқаулық статикалық сайтты (`apps/web/out`) серверге қадамдап шығарады. Қадамдар алдыңғы шығарудікімен (`deploy/site-referral-release.md`) бірдей: серверде ештеңе өшірілмейді, алдымен көшірме алынады, жаңа файлдар `rsync` арқылы үстіне жазылады (`--delete` жоқ), nginx баптауына тиіспейміз. Сайтты басқаша шығарып жүрсеңіз (Vercel, GitHub Pages, басқа жол), маған айтыңыз, нұсқаулықты сол жолға сай жазамын.

## Не шығады

- Жаңа логотип (алтын 3D дыбыс толқыны, ол «ARNA» деп оқылады): хедерде тек логотип, hero мен footer-де логотиптің астында ұран («Шекарасыз әлем» және тоғыз тілдегі аудармасы).
- Тіл жіптерінің қақпасында, телефон шапкасында, демо бетінде жаңа логотип/иконка; ескі эмблема мен жеке «ARNA» жазуы жоқ.
- Favicon, apple-touch, PWA иконкалары (maskable қоса), OG-сурет (1200x630), og/twitter тақырыбы мен сипаттамасында ұран.
- 404 беті мен қате беті: логотип және ұран (404 сақталған тілде көрінеді).
- Серіктестік трекері мен «Құпиялылық» сілтемесі өзгермеген.

Пакет: `C:\Users\acer\Desktop\arnavoice-site-brand.zip` (алдыңғы `arnavoice-site.zip` өзгеріссіз қалды, оған тиген жоқпын). Ішінде `apps/web/out` мазмұны (файлдар архив түбірінде: `index.html`, `ru/`, `_next/`, `brand/`, `404.html`, ...).

SHA-256: `6a86bbad5cafec87b5dbaf13db450ac0c303c611a8ec7b5b1503b1aea8e212a8`

Жинау командасы (README-дегідей): `NEXT_PUBLIC_SITE_URL=https://arnavoice.com NEXT_PUBLIC_ROOT_VIEW=site npm run build`.

## Қайда жарияланады: пайдаланушыдан қажеті

`arnavoice.com` қай жерде тұратыны репозиторийден анықталмайды (README тек жинау командасын көрсетеді). Алдыңғы шығарудағыдай, nginx статикалық файлдарды береді деп алынды (`try_files $uri $uri/ $uri.html =404`). Қажет:

1. Серверге кіру деректері (`USER@SERVER`) және `arnavoice.com` блогының `root` жолы (1-қадам оны көрсетеді). Жолды болжамаңыз.
2. Блокта `error_page 404 /404.html;` бар ма: жаңа 404 беті сол арқылы көрсетіледі (1-қадамның шығысынан көресіз). Жоқ болса, 404 кезінде nginx өзінің әдепкі бетін көрсетеді, бұл сайттың қалған бөлігіне әсер етпейді.
3. `arnavoice.com` алдында CDN бар ма (мысалы Cloudflare): болса, шығарудан кейін HTML мен `brand/` кэшін тазалаңыз.

## Шығару (бір блок, серверде)

Әр қадамның астындағы `# Күтілетін:` жолы дұрыс нәтижені көрсетеді. Қате болса, тоқтап, төмендегі «Кері қайтару» бөліміне өтіңіз.

```bash
# --- 0. Параметрлер (тек осы жерді толтырыңыз) -------------------------------------------------
SITE_ROOT=/ПАЙДАЛАНУШЫДАН/ҚАЖЕТ/root-жолы      # nginx блогындағы root, мысалы /var/www/arnavoice (болжамаңыз)
SHA=6a86bbad5cafec87b5dbaf13db450ac0c303c611a8ec7b5b1503b1aea8e212a8
STAMP=$(date +%Y%m%d-%H%M%S)
ZIP=/tmp/arnavoice-site-brand.zip
NEW=/tmp/arnavoice-new-$STAMP

# --- 1. Жолды растау (тек оқиды, ештеңе өзгертпейді) -------------------------------------------
nginx -T 2>/dev/null | grep -B2 -A14 -E 'server_name[^;]*[ ]arnavoice\.com'
# Күтілетін: server блогында root = SITE_ROOT, try_files $uri $uri/ $uri.html =404; (және error_page 404 /404.html; бар болса жақсы)
test -f "$SITE_ROOT/index.html" && echo "root табылды" || echo "ТОҚТАҢЫЗ: SITE_ROOT дұрыс емес"
# Күтілетін: root табылды

# --- 2. Zip-ті жүктеу (өз компьютеріңізден, бір рет): -----------------------------------------
# scp arnavoice-site-brand.zip USER@SERVER:/tmp/arnavoice-site-brand.zip      (zip жатқан қалтадан, жоғарыдағы «Пакет»)
# Күтілетін: 100%, қатесіз. Содан кейін серверде:
echo "$SHA  $ZIP" | sha256sum -c -
# Күтілетін: /tmp/arnavoice-site-brand.zip: OK   (басқа нәтиже болса, тоқтаңыз)

# --- 3. Көшірме (ештеңе өшірілмейді) -----------------------------------------------------------
cp -a "$SITE_ROOT" "${SITE_ROOT}.bak-$STAMP"
du -sh "$SITE_ROOT" "${SITE_ROOT}.bak-$STAMP"
# Күтілетін: екі қалтаның көлемі бірдей

# --- 4. Жаңа файлдарды уақытша қалтаға ашу (сайтқа тиіспейді) ---------------------------------
mkdir -p "$NEW" && unzip -q "$ZIP" -d "$NEW" && chmod -R a+rX "$NEW"      # unzip жоқ болса: apt-get install -y unzip
ls "$NEW/index.html" "$NEW/404.html" "$NEW/ru/index.html" "$NEW/brand/arna-logo-480.webp" "$NEW/brand/icon-512.png" "$NEW/og.png"
grep -o 'class="lockup__slogan"' "$NEW/ru/index.html" | wc -l
# Күтілетін: алты файл да тізімделеді; соңғы команда 2 шығарады (hero мен footer)

# --- 5. Жаңа файлдарды сайттың үстіне жазу (--delete ЖОҚ: ештеңе өшірілмейді) -----------------
rsync -a "$NEW"/ "$SITE_ROOT"/
# Күтілетін: қатесіз, шығыс жоқ. Ескі файлдар (emblem-*.png, wordmark-*.webp) қалады, бірақ ешбір бет оларды қолданбайды

# --- 6. nginx: баптау өзгермейді, статикалық файлдар, қайта жүктеу керек емес ----------------
nginx -t
# Күтілетін: syntax is ok / test is successful

# --- 7. Тексеру (кез келген компьютерден) ------------------------------------------------------
curl -s -o /dev/null -w "%{http_code}\n" https://arnavoice.com/ru/
# Күтілетін: 200
curl -s https://arnavoice.com/ru/ | grep -o "Мир без границ" | wc -l
# Күтілетін: 0-ден көп сан (бұл сайтта 14: hero, footer, og-мета және беттің ішкі деректері). Кері қайтарғанда 0 болады
curl -s https://arnavoice.com/kk/ | grep -o '<meta property="og:title" content="[^"]*"'
# Күтілетін: <meta property="og:title" content="ARNA: Шекарасыз әлем"
for f in brand/arna-logo-480.webp brand/arna-logo-960.webp brand/favicon-32.png brand/favicon-96.png brand/apple-touch-icon.png brand/icon-192.png brand/icon-512.png brand/icon-maskable-512.png og.png manifest.webmanifest; do printf "%s " "$f"; curl -s -o /dev/null -w "%{http_code}\n" "https://arnavoice.com/$f"; done
# Күтілетін: он жол да 200
curl -s -o /dev/null -w "%{http_code}\n" https://arnavoice.com/ru/bul-bet-joq/
# Күтілетін: 404 (error_page болса, жауап денесінде brand-screen бар)
```

Браузерде (8-қадам, қолмен): `https://arnavoice.com/ru/` және `/kk/` ашыңыз (қатты жаңарту Ctrl+F5, favicon кэштеледі). Хедерде тек логотип, hero-да логотип пен астында ұран, footer-де логотип пен ұран, қойындыдағы иконка жаңа болуы керек. Жоқ бетті ашып (`/kk/осы-бет-жоқ/`) 404 бетін көріңіз.

Әлеуметтік желілердегі сілтеменің алдын ала көрінісі (превью) бұрынғы суретті бірнеше күн кэштейді: Telegram, WhatsApp, Facebook (Sharing Debugger) үшін сілтемені қайта сканерлету керек болады.

## Кері қайтару (тек қажет болса)

Көшірмедегі ескі файлдар жаңасының үстіне қайта жазылады. Ештеңе өшірілмейді; жаңа релиз қосқан файлдар (`brand/arna-logo-*`, `404.html`, ...) қалады, бірақ ескі беттер оларды қолданбайды.

```bash
rsync -a --checksum "${SITE_ROOT}.bak-$STAMP"/ "$SITE_ROOT"/
curl -s https://arnavoice.com/ru/ | grep -o "Мир без границ" | wc -l
# Күтілетін: 0 (ескі нұсқа қайтты). CDN болса, кэшті тазалаңыз
```

`STAMP` жаңа терминалда жоғалса, көшірме атын `ls -d "${SITE_ROOT}".bak-*` көрсетеді.

## Кейін жинап тастау (міндетті емес)

Бәрі жақсы жұмыс істегеннен кейін ғана, қолмен: `/tmp/arnavoice-new-*` және `/tmp/arnavoice-site-brand.zip`, ал көшірмені (`${SITE_ROOT}.bak-*`) бірнеше күннен кейін өшіруге болады. Сайт жаңа нұсқада жұмыс істеп тұрғанда `brand/emblem-*` және `brand/wordmark-*` файлдарын серверден қолмен өшіруге болады (олар қолданылмайды). Бұл нұсқаулық өзі ештеңе өшірмейді.
