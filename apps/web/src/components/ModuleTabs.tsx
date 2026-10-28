"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { ModuleArt } from "./ModuleArt";

type Item = { name: string; text: string };

/**
 * The five modules as stations on one line (a tablist). Every panel is in the HTML (for search and for no-JS);
 * the active one is shown. The hero's module line opens a module through the `arna:module` event.
 */
export function ModuleTabs({
  items,
  label,
  liveHref,
  liveLabel,
  pilotHref,
  pilotLabel,
}: {
  items: Item[];
  label: string;
  liveHref: string;
  liveLabel: string;
  pilotHref: string;
  pilotLabel: string;
}) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = (kind: string, i: number) => `${uid}-${kind}-${i}`;

  useEffect(() => {
    const onPick = (e: Event) => {
      const i = (e as CustomEvent<number>).detail;
      if (Number.isInteger(i) && i >= 0 && i < items.length) setActive(i);
    };
    window.addEventListener("arna:module", onPick);
    return () => window.removeEventListener("arna:module", onPick);
  }, [items.length]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = e.key === (rtl ? "ArrowLeft" : "ArrowRight") ? i + 1 : e.key === (rtl ? "ArrowRight" : "ArrowLeft") ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const n = (next + items.length) % items.length;
    setActive(n);
    tabs.current[n]?.focus();
  };

  return (
    <div className="mod-stage">
      <span aria-hidden className="mod-rail" />
      <div className="wrap">
        <div role="tablist" aria-label={label} className="mod-tabs">
          {items.map((it, i) => (
            <button
              key={it.name}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={id("tab", i)}
              aria-selected={active === i}
              aria-controls={id("panel", i)}
              tabIndex={active === i ? 0 : -1}
              className="mod-tab"
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className="mod-node" aria-hidden />
              <span className="mod-name">{it.name}</span>
            </button>
          ))}
        </div>

        {items.map((it, i) => (
          <div key={it.name} role="tabpanel" id={id("panel", i)} aria-labelledby={id("tab", i)} hidden={active !== i} className="mod-panel">
            <div className="mod-copy">
              <h3 className="mod-title">{it.name}</h3>
              <p className="mod-text">{it.text}</p>
              <div className="mod-cta">
                {i === 0 && (
                  <a href={liveHref} className="btn btn-primary">
                    {liveLabel}
                    <ArrowUpRight size={20} weight="bold" aria-hidden className="rtl:-scale-x-100" />
                  </a>
                )}
                <a href={pilotHref} className={i === 0 ? "link-arrow" : "btn btn-ghost"}>
                  {pilotLabel}
                  {i !== 0 && <ArrowRight size={20} weight="bold" aria-hidden className="rtl:-scale-x-100" />}
                </a>
              </div>
            </div>
            <div className="mod-art-wrap">
              <ModuleArt index={i} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
