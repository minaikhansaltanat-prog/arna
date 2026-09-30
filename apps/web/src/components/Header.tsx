"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, PhoneCall, WhatsappLogo } from "@phosphor-icons/react";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { PHONE_DISPLAY, PHONE_TEL, SECTIONS, waLink, withBase } from "@/lib/site";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  lang: string;
  locales: LocaleListItem[];
  nav: Dictionary["nav"];
  a11y: Dictionary["a11y"];
  call: string;
  whatsapp: string;
  waMessage: string;
};

const LINKS = ["how", "demo", "features", "cases", "pricing"] as const;

/**
 * Fixed header. Desktop: logo, links, language, theme, CTA.
 * Phone: logo on one side; on the other [language] [burger]. Opening the menu turns the burger into an X
 * in the same spot. The menu panel is a sibling of the header (a backdrop-filter parent would trap a fixed child).
 */
export function Header({ lang, locales, nav, a11y, call, whatsapp, waMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // "scrolled" without a scroll listener: a 1px sentinel at the top of the page
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scroll lock + hide the WhatsApp button while the menu is open
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.menu = "open";
    else delete root.dataset.menu;
    return () => {
      delete root.dataset.menu;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 1280px)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const label = (id: (typeof LINKS)[number]) => nav[id];
  const close = () => setOpen(false);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2" />
      <header className="site-header" data-scrolled={scrolled} data-menu-open={open}>
        <div className="wrap flex h-full items-center justify-between gap-3">
          <a href={withBase(`/${lang}/`)} className="brand-link" aria-label={a11y.home} onClick={close}>
            <img src={withBase("/brand/emblem-96.png")} width={38} height={38} alt="" className="size-[38px] shrink-0" />
            <span className="brand-word">ARNA</span>
          </a>

          <nav aria-label={a11y.mainNav} className="hidden items-center gap-1 xl:flex">
            {LINKS.map((id) => (
              <a key={id} href={`#${SECTIONS[id]}`} className="nav-link">
                {label(id)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <ThemeToggle toDark={a11y.themeToDark} toLight={a11y.themeToLight} className="hidden xl:inline-grid" />
            <LanguageSwitcher current={lang} locales={locales} label={a11y.langSwitch} />
            <a href={`#${SECTIONS.pilot}`} className="btn btn-primary btn-sm ms-1 hidden whitespace-nowrap xl:inline-flex">
              {nav.pilot}
            </a>
            <button
              ref={burgerRef}
              type="button"
              className="icon-btn burger xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? a11y.menuClose : a11y.menuOpen}
              onClick={() => setOpen((v) => !v)}
            >
              <i />
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className="mobile-menu xl:hidden" data-open={open} inert={!open}>
        <div className="wrap flex min-h-full flex-col pb-10">
          <nav aria-label={a11y.mainNav}>
            <ul className="mt-2">
              {LINKS.map((id, i) => (
                <li key={id} className="menu-item" style={{ ["--i" as string]: i }}>
                  <a href={`#${SECTIONS[id]}`} className="menu-link" onClick={close}>
                    <span>{label(id)}</span>
                    <ArrowRight size={22} weight="bold" aria-hidden className="shrink-0 text-accent rtl:-scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="menu-item mt-8" style={{ ["--i" as string]: LINKS.length }}>
            <a href={`#${SECTIONS.pilot}`} className="btn btn-primary w-full" onClick={close}>
              {nav.pilot}
            </a>
          </div>

          <div className="menu-item mt-4 grid grid-cols-2 gap-3" style={{ ["--i" as string]: LINKS.length + 1 }}>
            <a href={`tel:${PHONE_TEL}`} className="btn btn-ghost btn-sm">
              <PhoneCall size={20} weight="duotone" aria-hidden />
              {call}
            </a>
            <a href={waLink(waMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <WhatsappLogo size={20} weight="fill" aria-hidden className="text-wa" />
              {whatsapp}
            </a>
          </div>

          <div
            className="menu-item mt-auto flex flex-col gap-3 pt-10"
            style={{ ["--i" as string]: LINKS.length + 2 }}
          >
            <ThemeToggle toDark={a11y.themeToDark} toLight={a11y.themeToLight} withLabel />
            <bdi dir="ltr" className="text-sm text-muted">
              {PHONE_DISPLAY}
            </bdi>
          </div>
        </div>
      </div>
    </>
  );
}
