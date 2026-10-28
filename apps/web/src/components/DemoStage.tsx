"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { LangStrands } from "./LangStrands";
import type { Slogan } from "./HeroCaption";
import { PhoneDemo } from "./PhoneDemo";
import { SectionNode } from "./SectionNode";

type Script = { lines: string[]; summary: string[] };

/**
 * The demo section: the language strands and the scripted phone share one choice.
 * Picking a strand starts the phone in that language; picking a language on the phone lights its strand.
 */
export function DemoStage({
  dict,
  dicts,
  locales,
  scripts,
  source,
  slogans,
  intro,
  notice,
}: {
  dict: Dictionary["demo"];
  dicts: Record<string, Dictionary["demo"]>;
  locales: LocaleListItem[];
  scripts: Record<string, Script>;
  source: string;
  slogans: Record<string, Slogan>;
  intro: ReactNode;
  notice: ReactNode;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [ext, setExt] = useState<{ code: string; n: number } | null>(null);

  return (
    <div className="wrap relative demo-grid">
      <SectionNode />
      <div className="demo-intro">{intro}</div>
      <div className="demo-strands">
        <LangStrands
          locales={locales}
          slogans={slogans}
          hint={dict.strands.hint}
          speaker={dict.strands.speaker}
          picked={picked}
          onPick={(code) => {
            setPicked(code);
            setExt((p) => ({ code, n: (p?.n ?? 0) + 1 }));
          }}
        />
      </div>
      <div className="demo-note">{notice}</div>
      <div className="demo-phone">
        <div aria-hidden className="demo-halo" />
        <PhoneDemo dict={dict} dicts={dicts} locales={locales} scripts={scripts} source={source} externalPick={ext} onTargetChange={setPicked} />
      </div>
    </div>
  );
}
