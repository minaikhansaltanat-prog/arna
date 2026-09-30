import { defaultLocale, localeList } from "@arna/i18n";
import { STORAGE } from "@/lib/site";

/**
 * "/" (I-02): send the visitor to the saved language, else the browser language, else Russian.
 * Static export has no server, so this is a tiny inline script. Crawlers and no-JS users get plain links.
 */
const script = `(function(){var L=${JSON.stringify(localeList.map((l) => l.code))},l=null;try{var s=localStorage.getItem(${JSON.stringify(STORAGE.lang)});if(s&&L.indexOf(s)>-1)l=s}catch(e){}if(!l){var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];for(var i=0;i<n.length&&!l;i++){var c=String(n[i]).toLowerCase().split("-")[0];if(L.indexOf(c)>-1)l=c}}location.replace("/"+(l||${JSON.stringify(defaultLocale)})+"/"+location.hash)})();`;

export default function RootRedirect() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-6 py-16 text-center">
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=/${defaultLocale}/`} />
      </noscript>
      <ul className="flex max-w-xl flex-wrap justify-center gap-3">
        {localeList.map((l) => (
          <li key={l.code}>
            <a className="btn btn-ghost btn-sm" href={`/${l.code}/`} lang={l.htmlLang} dir={l.dir} data-names={l.code}>
              {l.nativeName}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
