import { APP_URL, BASE_PATH } from "@/lib/site";

/**
 * Partner links: https://arnavoice.com/?ref=CODE. A small inline script (like the theme script) that runs on every page.
 * It tells the service about the visit with POST {APP_URL}/api/referral/click; the service sets its own cookies
 * (arna_ref, arna_did) on app.arnavoice.com, this site sets none. No analytics, no library. Rules of the service:
 *  - the code is 4 to 20 letters or digits, anything else sends nothing;
 *  - one request per code and browser session (sessionStorage), so a reload does not repeat it;
 *  - a failure never reaches the page;
 *  - `page` is the path without the sub-path the site may be served from (BASE_PATH).
 * The request stays in window.__arnaRef: RedirectView waits for it (at most a second) before it leaves "/" for a language
 * page, so a link opened on "/" is counted once and the cookie is set before the page changes.
 */
const endpoint = `${APP_URL}/api/referral/click`;

export const referralScript =
  `(function(){try{var c=(new URLSearchParams(location.search).get("ref")||"").trim().toUpperCase(),K="arna-ref-sent",` +
  `S=function(f){try{return f()}catch(e){}};` +
  `if(!/^[A-Z0-9]{4,20}$/.test(c)||S(function(){return sessionStorage.getItem(K)})===c)return;` +
  `var p=location.pathname,b=${JSON.stringify(BASE_PATH)};if(b&&(p===b||p.indexOf(b+"/")===0))p=p.slice(b.length)||"/";` +
  `window.__arnaRef=fetch(${JSON.stringify(endpoint)},{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},` +
  `body:JSON.stringify({code:c,page:p}),keepalive:true}).then(function(r){if(r.ok)S(function(){sessionStorage.setItem(K,c)})}).catch(function(){})` +
  `}catch(e){}})();`;
