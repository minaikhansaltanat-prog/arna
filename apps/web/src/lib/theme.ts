import { STORAGE } from "./site";

/** Runs before paint: picks the saved theme, else the system theme. Prevents a light/dark flash. */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(STORAGE.theme)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`;
