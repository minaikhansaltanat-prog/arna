# Шығару: серіктестік сілтемелері бар сайт (arnavoice.com)

Бұл нұсқаулық статикалық сайтты (`apps/web/out`) серверге бір-бірден шығарады. Серверде ештеңе өшірілмейді: алдымен
көшірме алынады, жаңа файлдар `rsync` арқылы үстіне жазылады (`--delete` жоқ), nginx баптауына тиіспейміз.

## Не шығады

- `https://arnavoice.com/?ref=КОД` сілтемесі тіл бетіне `?ref` сақталып өтеді, сайт `POST https://app.arnavoice.com/api/referral/click`
  жібереді (бір сессияда бір рет, cookie-ді сервер қояды).
- Footer-де «Құпиялылық» сілтемесі (`https://app.arnavoice.com/privacy/`), 10 тілде.
- Дизайн, түймелер, бағалар өзгермеген.

Пакет: `C:\Users\acer\Desktop\arnavoice-site.zip`, ішінде `apps/web/out` мазмұны (файлдар архив түбірінде: `index.html`, `ru/`, `_next/`, ...).

SHA-256: `014a4bc67bbbb707c66270133305f5d00cbcab0135ab2e1ae747627ce2dfdf95`

Жинау командасы (README-дегідей): `NEXT_PUBLIC_SITE_URL=https://arnavoice.com NEXT_PUBLIC_ROOT_VIEW=site npm run build`.

## Қайда жарияланады: анықталғаны және пайдаланушыдан қажеті

Репозиторийде үш жол бар: GitHub Pages (`.github/workflows/pages.yml`, `/arna` ішкі жолымен), Vercel (`vercel.json`) және өз VPS
(`deploy/setup-server.sh`, nginx, әдепкі `/var/www/arna`). README `arnavoice.com` үшін тек жинау командасын көрсетеді, қай жерде тұратыны
репозиторийден анықталмайды.

Тапсырмада `arnavoice.com` nginx блогы статикалық файлдарды беретіні айтылған (`try_files $uri $uri/ $uri.html =404`), сондықтан
төмендегі қадамдар nginx үшін жазылған. Пайдаланушыдан қажет:

1. Серверге кіру деректері (`USER@SERVER`) және `arnavoice.com` блогының `root` жолы (0-қадам оны көрсетеді). Жолды болжамаңыз.
2. `arnavoice.com` алдында CDN бар ма (мысалы Cloudflare): болса, шығарудан кейін HTML кэшін тазалау керек.
3. `www.arnavoice.com` бар ма: сервер CORS-ты тек `https://arnavoice.com` және `https://app.arnavoice.com` Origin-інен береді, сондықтан `www`
   `arnavoice.com`-ға бағытталуы керек, әйтпесе `www` арқылы келгендердің басуы есептелмейді.
4. Егер сайт іс жүзінде Vercel-де не GitHub Pages-те тұрса, бұл нұсқаулық керек емес (`main`-ге push жеткілікті), бірақ `github.io` Origin-інен
   сервер CORS бермейді, трекер тек `https://arnavoice.com` доменінде жұмыс істейді.

## Шығару (бір блок, серверде)

Әр қадамның астындағы `# Күтілетін:` жолы дұрыс нәтижені көрсетеді. Қате болса, тоқтап, төмендегі «Кері қайтару» бөліміне өтіңіз.

```bash
# --- 0. Параметрлер (тек осы жерді толтырыңыз) -------------------------------------------------
SITE_ROOT=/ПАЙДАЛАНУШЫДАН/ҚАЖЕТ/root-жолы      # nginx блогындағы root, мысалы /var/www/arnavoice (болжамаңыз)
SHA=014a4bc67bbbb707c66270133305f5d00cbcab0135ab2e1ae747627ce2dfdf95
STAMP=$(date +%Y%m%d-%H%M%S)
ZIP=/tmp/arnavoice-site.zip
NEW=/tmp/arnavoice-new-$STAMP

# --- 1. Жолды растау (тек оқиды, ештеңе өзгертпейді) -------------------------------------------
nginx -T 2>/dev/null | grep -B2 -A14 -E 'server_name[^;]*[ ]arnavoice\.com'
# Күтілетін: server блогында root = SITE_ROOT, location / ішінде try_files $uri $uri/ $uri.html =404;
test -f "$SITE_ROOT/index.html" && echo "root табылды" || echo "ТОҚТАҢЫЗ: SITE_ROOT дұрыс емес"
# Күтілетін: root табылды

# --- 2. Zip-ті жүктеу (өз компьютеріңізден, бір рет): -----------------------------------------
# scp arnavoice-site.zip USER@SERVER:/tmp/arnavoice-site.zip      (zip жатқан қалтадан, жоғарыдағы «Пакет»)
# Күтілетін: 100%, қатесіз. Содан кейін серверде:
echo "$SHA  $ZIP" | sha256sum -c -
# Күтілетін: /tmp/arnavoice-site.zip: OK   (басқа нәтиже болса, тоқтаңыз)

# --- 3. Көшірме (ештеңе өшірілмейді) -----------------------------------------------------------
cp -a "$SITE_ROOT" "${SITE_ROOT}.bak-$STAMP"
du -sh "$SITE_ROOT" "${SITE_ROOT}.bak-$STAMP"
# Күтілетін: екі қалтаның көлемі бірдей

# --- 4. Жаңа файлдарды уақытша қалтаға ашу (сайтқа тиіспейді) ---------------------------------
mkdir -p "$NEW" && unzip -q "$ZIP" -d "$NEW" && chmod -R a+rX "$NEW"      # unzip жоқ болса: apt-get install -y unzip
ls "$NEW/index.html" "$NEW/ru/index.html" "$NEW/kk/demo/index.html" "$NEW/audio/demo/kk/1.mp3"
grep -c "api/referral/click" "$NEW/ru/index.html"
# Күтілетін: төрт файл да тізімделеді; соңғы команда 1 (немесе одан көп) шығарады

# --- 5. Жаңа файлдарды сайттың үстіне жазу (--delete ЖОҚ: ештеңе өшірілмейді) -----------------
rsync -a "$NEW"/ "$SITE_ROOT"/
# Күтілетін: қатесіз, шығыс жоқ. Ескі файлдар қалады, олар зиянсыз

# --- 6. nginx: баптау өзгермейді, статикалық файлдар, қайта жүктеу керек емес ----------------
nginx -t
# Күтілетін: syntax is ok / test is successful

# --- 7. Тексеру (кез келген компьютерден) ------------------------------------------------------
curl -s -o /dev/null -w "%{http_code}\n" https://arnavoice.com/ru/
# Күтілетін: 200
curl -s https://arnavoice.com/ru/ | grep -c "api/referral/click"
# Күтілетін: 1 (немесе одан көп). Кері қайтарғанда бұл 0 болады
curl -s https://arnavoice.com/ru/ | grep -o 'href="https://app.arnavoice.com/privacy/"'
# Күтілетін: href="https://app.arnavoice.com/privacy/"
```

Браузерде (8-қадам, қолмен): серверде белсенді серіктестің нақты кодымен `https://arnavoice.com/?ref=<код>` ашыңыз.
DevTools > Network: `referral/click` сұрауы `200` және жауабында `Set-Cookie: arna_ref=...`, мекенжай жолы `https://arnavoice.com/ru/?ref=<код>`
(не браузер тіліне сай тіл) болуы керек; бетті жаңартқанда сұрау қайталанбайды. Әкімші бетінде серіктестің «Басу» саны +1 артады.
Footer-де «Құпиялылық» сілтемесі `https://app.arnavoice.com/privacy/` бетін ашады.

## Кері қайтару (тек қажет болса)

Көшірмедегі ескі файлдар жаңасының үстіне қайта жазылады. Ештеңе өшірілмейді; жаңа релиз қосқан файлдар қалады, бірақ ескі беттер оларды
қолданбайды.

```bash
rsync -a --checksum "${SITE_ROOT}.bak-$STAMP"/ "$SITE_ROOT"/
curl -s https://arnavoice.com/ru/ | grep -c "api/referral/click"
# Күтілетін: 0 (ескі нұсқа қайтты). CDN болса, кэшті тазалаңыз
```

`STAMP` жаңа терминалда жоғалса, көшірме атын `ls -d "${SITE_ROOT}".bak-*` көрсетеді.

## Кейін жинап тастау (міндетті емес)

Бәрі жақсы жұмыс істегеннен кейін ғана, қолмен: `/tmp/arnavoice-new-*` және `/tmp/arnavoice-site.zip` қалталарын, ал көшірмені
(`${SITE_ROOT}.bak-*`) бірнеше күннен кейін өшіруге болады. Бұл нұсқаулық өзі ештеңе өшірмейді.
