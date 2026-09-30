"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, Check, Globe } from "@phosphor-icons/react";
import type { LocaleListItem } from "@arna/i18n";
import { STORAGE } from "@/lib/site";

/**
 * Language switcher (L-07). Compact (globe + code) next to the burger on phones,
 * globe + native name on wider screens. Opens a two-column sheet with all languages in their own script.
 * Each item is a real link to /<code>/ (works without JS and for crawlers). With JS it navigates to the same section
 * of the other language page (plain page load: static files only, no server or RSC requests needed on any host).
 */
export function LanguageSwitcher({
  current,
  locales,
  label,
}: {
  current: string;
  locales: LocaleListItem[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cur = locales.find((l) => l.code === current) ?? locales[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code: string) => {
    try {
      localStorage.setItem(STORAGE.lang, code);
    } catch {}
    setOpen(false);
    if (code === current) return;
    // Same section on the other language page: the section whose top has most recently passed the header.
    let id = "";
    for (const s of document.querySelectorAll<HTMLElement>("main > section[id]")) {
      if (s.getBoundingClientRect().top <= 140) id = s.id;
    }
    window.location.assign(`/${code}/${id && id !== "top" ? `#${id}` : ""}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        className="lang-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="lang-sheet"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={20} weight="duotone" aria-hidden className="shrink-0" />
        <span className="text-[0.8rem] font-semibold uppercase tracking-wider md:hidden">{cur.code}</span>
        <span className="hidden whitespace-nowrap text-[0.92rem] font-semibold md:inline" data-names={cur.code}>
          {cur.nativeName}
        </span>
        <CaretDown size={14} weight="bold" aria-hidden className="hidden shrink-0 md:block" />
      </button>

      <div id="lang-sheet" className="lang-sheet" data-open={open} inert={!open}>
        <ul className="grid grid-cols-2 gap-1.5">
          {locales.map((l) => {
            const active = l.code === current;
            return (
              <li key={l.code}>
                <a
                  href={`/${l.code}/`}
                  hrefLang={l.htmlLang}
                  lang={l.htmlLang}
                  aria-current={active ? "true" : undefined}
                  className="lang-item"
                  onClick={(e) => {
                    e.preventDefault();
                    choose(l.code);
                  }}
                >
                  <span className="lang-item__name" dir={l.dir} data-names={l.code}>
                    {l.nativeName}
                  </span>
                  <span className="lang-item__code" aria-hidden>
                    {active ? <Check size={16} weight="bold" /> : l.code}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
