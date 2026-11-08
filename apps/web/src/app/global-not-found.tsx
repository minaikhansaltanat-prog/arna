import type { Metadata } from "next";
import { defaultLocale, getDictionary, getMeta, getSlogan, localeList } from "@arna/i18n";
import { BrandScreen } from "@/components/BrandScreen";
import { ICONS, sloganEm } from "@/lib/brand";
import { STORAGE, withBase } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = { title: "404", robots: { index: false } };

// The 404 page does not know its language. It starts in the default one, with the slogan of every other language already in the page
// (hidden), and a small inline script shows the one of the language the visitor saved (or the browser's), like the "/" redirect does.
// The script only changes attributes: changing text before React hydrates would be a hydration error.
const languages = Object.fromEntries(
  localeList.map((l) => [l.code, { h: l.htmlLang, d: l.dir, f: l.font, e: sloganEm(getSlogan(l.code), l.font), a: getDictionary(l.code).a11y.home }]),
);
const pickLanguage = `(function(){var D=${JSON.stringify(languages)},l=null;try{var s=localStorage.getItem(${JSON.stringify(STORAGE.lang)});if(s&&D[s])l=s}catch(e){}if(!l){var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];for(var i=0;i<n.length&&!l;i++){var c=String(n[i]).toLowerCase().split("-")[0];if(D[c])l=c}}if(!l||l===${JSON.stringify(defaultLocale)})return;var d=D[l],r=document.documentElement,q=document.querySelectorAll(".lockup__slogan");r.lang=d.h;r.dir=d.d;r.setAttribute("data-font",d.f);for(var k=0;k<q.length;k++)q[k].hidden=q[k].getAttribute("data-lang")!==l;q[0].parentNode.style.setProperty("--slogan-em",d.e);var a=document.querySelector(".brand-screen__home");a.setAttribute("aria-label",d.a);a.setAttribute("href",${JSON.stringify(withBase("/"))}+l+"/")})();`;

export default function GlobalNotFound() {
  const meta = getMeta(defaultLocale);
  return (
    <html lang={meta.htmlLang} dir={meta.dir} translate="no" data-font={meta.font} suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" type="image/png" sizes="32x32" href={ICONS.favicon32} />
        <link rel="icon" type="image/png" sizes="96x96" href={ICONS.favicon96} />
        <link rel="apple-touch-icon" sizes="180x180" href={ICONS.appleTouch} />
      </head>
      <body>
        <BrandScreen
          href={withBase(`/${defaultLocale}/`)}
          label={getDictionary(defaultLocale).a11y.home}
          slogan={getSlogan(defaultLocale)}
          dir={meta.dir}
          script={meta.font}
          alternatives={localeList.filter((l) => l.code !== defaultLocale).map((l) => ({ code: l.code, lang: l.htmlLang, slogan: getSlogan(l.code), dir: l.dir, script: l.font }))}
          code="404"
        />
        <script dangerouslySetInnerHTML={{ __html: pickLanguage }} />
      </body>
    </html>
  );
}
