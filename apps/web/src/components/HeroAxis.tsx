"use client";

import { SECTIONS } from "@/lib/site";

/**
 * The five modules as stations on one line, under the hero wave. A click jumps to the modules section
 * and opens that module (the tabs listen for the `arna:module` event).
 */
export function HeroAxis({ label, names }: { label: string; names: string[] }) {
  return (
    <nav aria-label={label} className="hero-axis">
      <ul>
        {names.map((name, i) => (
          <li key={name} data-first={i === 0}>
            <a
              href={`#${SECTIONS.modules}`}
              onClick={() => window.dispatchEvent(new CustomEvent("arna:module", { detail: i }))}
            >
              <span className="hero-axis__node" aria-hidden />
              {name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
