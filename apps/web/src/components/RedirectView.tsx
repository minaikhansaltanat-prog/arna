import { defaultLocale, localeList } from "@arna/i18n";
import { BASE_PATH, STORAGE, withBase } from "@/lib/site";

/**
 * Language redirect (I-02) for "/" and "/demo/": saved language, else browser language, else Russian.
 * Static export has no server, so this is a tiny inline script. Crawlers and no-JS users get plain links.
 * `suffix` is what follows the language, "" for the landing page or "demo/" for the standalone demo.
 * The query string (?ref=CODE of a partner link) and the hash go along. A partner click that is already on its way
 * (window.__arnaRef, see lib/referral.ts) gets up to a second to finish, so it is counted once, by this page.
 */
export function RedirectView({ suffix }: { suffix: string }) {
  const script = `(function(){var L=${JSON.stringify(localeList.map((l) => l.code))},l=null;try{var s=localStorage.getItem(${JSON.stringify(STORAGE.lang)});if(s&&L.indexOf(s)>-1)l=s}catch(e){}if(!l){var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];for(var i=0;i<n.length&&!l;i++){var c=String(n[i]).toLowerCase().split("-")[0];if(L.indexOf(c)>-1)l=c}}var u=${JSON.stringify(BASE_PATH)}+"/"+(l||${JSON.stringify(defaultLocale)})+"/"+${JSON.stringify(suffix)}+location.search+location.hash,g=function(){location.replace(u)},t=window.__arnaRef;t?Promise.race([t,new Promise(function(r){setTimeout(r,1000)})]).then(g,g):g()})();`;

  return (
    <main className="grid min-h-[100dvh] place-items-center px-6 py-16 text-center">
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${withBase(`/${defaultLocale}/${suffix}`)}`} />
      </noscript>
      <ul className="flex max-w-xl flex-wrap justify-center gap-3">
        {localeList.map((l) => (
          <li key={l.code}>
            <a className="btn btn-ghost btn-sm" href={withBase(`/${l.code}/${suffix}`)} lang={l.htmlLang} dir={l.dir} data-names={l.code}>
              {l.nativeName}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
