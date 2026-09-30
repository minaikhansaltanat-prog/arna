"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
import {
  ArrowClockwise,
  CheckCircle,
  ClosedCaptioning,
  Microphone,
  MoonStars,
  Sparkle,
  SpeakerHigh,
} from "@phosphor-icons/react";
import type { Dictionary, LocaleListItem } from "@arna/i18n";
import { WaveCanvas } from "./WaveCanvas";
import { withBase } from "@/lib/site";

/**
 * Scripted browser demo (TZ 5.2). No speech recognition, no translation, no backend:
 * the transcript is prepared text from content/demo-script.json. It is labelled as a scripted demo at all times (D-09).
 * Steps: language (D-01) > voice check (D-02) > live listening (D-03/04/05) > auto-summary (D-06), restart at any time (D-07).
 */
type Step = "lang" | "voice" | "live" | "summary";
type Script = { lines: string[]; summary: string[] };
type Props = {
  dict: Dictionary["demo"];
  locales: LocaleListItem[];
  scripts: Record<string, Script>;
  source: string;
};

const STEPS: Step[] = ["lang", "voice", "live", "summary"];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

type Pair = { o: string[]; t: string[] };
type Seg = { from: number; to: number; line: number; kind: "o" | "t"; n: number };
type Progress = { line: number; o: number; t: number; done: boolean };

function buildTimeline(pairs: Pair[], same: boolean, msPerChar: number) {
  const segs: Seg[] = [];
  let at = 350;
  pairs.forEach((p, line) => {
    if (!same) {
      const d = clamp(p.o.length * 24, 600, 1800);
      segs.push({ from: at, to: at + d, line, kind: "o", n: p.o.length });
      at += d + 240;
    }
    const d = clamp(p.t.length * msPerChar, 700, 2300);
    segs.push({ from: at, to: at + d, line, kind: "t", n: p.t.length });
    at += d + 520;
  });
  return { segs, total: at };
}

function progressAt(e: number, tl: ReturnType<typeof buildTimeline>, pairs: Pair[]): Progress {
  let line = 0;
  let o = 0;
  let t = 0;
  for (const s of tl.segs) {
    if (e < s.from) break;
    const n = e >= s.to ? s.n : Math.floor((s.n * (e - s.from)) / (s.to - s.from));
    line = s.line;
    if (s.kind === "o") {
      o = n;
      t = 0;
    } else {
      t = n;
      o = pairs[s.line].o.length;
    }
  }
  return { line, o, t, done: e >= tl.total };
}

export function PhoneDemo({ dict, locales, scripts, source }: Props) {
  const [step, setStep] = useState<Step>("lang");
  const [target, setTarget] = useState<string | null>(null);
  const [dim, setDim] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [subsOn, setSubsOn] = useState(true);
  const [run, setRun] = useState(0);
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tMeta = locales.find((l) => l.code === target) ?? null;
  const sMeta = locales.find((l) => l.code === source) ?? locales[0];

  const reset = useCallback(() => {
    if (advance.current) clearTimeout(advance.current);
    setStep("lang");
    setTarget(null);
    setDim(false);
    setAudioOn(true);
    setSubsOn(true);
    setRun((r) => r + 1);
  }, []);

  useEffect(() => () => void (advance.current && clearTimeout(advance.current)), []);

  const pick = (code: string) => {
    setTarget(code);
    if (advance.current) clearTimeout(advance.current);
    advance.current = setTimeout(() => setStep("voice"), 380); // D-01: moves on by itself
  };

  const goLive = () => {
    setDim(false);
    setStep("live");
  };
  const goSummary = useCallback(() => {
    setDim(false);
    setStep("summary");
  }, []);

  const idx = STEPS.indexOf(step);

  return (
    <div className="phone dark-scope" data-step={step}>
      <div className="phone__bezel">
        <div className="phone__screen">
          <span className="phone__island" aria-hidden />

          <div className="phone-head">
            <span className="flex items-center gap-2">
              <img src={withBase("/brand/emblem-96.png")} width={24} height={24} alt="" className="size-6" />
              <span className="font-display text-[0.95rem] font-[var(--w-display)] tracking-[0.06em]">ARNA</span>
            </span>
            {step !== "lang" && (
              <button type="button" className="phone-icon-btn" onClick={reset} aria-label={dict.summary.restart} title={dict.summary.restart}>
                <ArrowClockwise size={18} weight="bold" aria-hidden />
              </button>
            )}
          </div>

          {/* D-09: always visible, says it plainly */}
          <p className="phone-badge" role="note">
            <Sparkle size={14} weight="fill" aria-hidden className="shrink-0" />
            <span>{dict.badge}</span>
          </p>

          <div className="phone-steps" aria-hidden>
            {STEPS.map((s, i) => (
              <i key={s} data-on={i <= idx} />
            ))}
          </div>
          <p className="phone-step-name" aria-live="polite">
            {dict.steps[idx]}
          </p>

          <div className="phone__body">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={step + run}
                className="h-full"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === "lang" && <LangStep dict={dict} locales={locales} picked={target} onPick={pick} />}
                {step === "voice" && <VoiceStep dict={dict} onConfirm={goLive} />}
                {step === "live" && tMeta && (
                  <LiveStep
                    dict={dict}
                    tMeta={tMeta}
                    sMeta={sMeta}
                    tLines={scripts[tMeta.code]?.lines ?? []}
                    sLines={scripts[source]?.lines ?? []}
                    audioOn={audioOn}
                    subsOn={subsOn}
                    dim={dim}
                    onAudio={() => setAudioOn((v) => !v)}
                    onSubs={() => setSubsOn((v) => !v)}
                    onDim={setDim}
                    onDone={goSummary}
                  />
                )}
                {step === "summary" && tMeta && (
                  <SummaryStep dict={dict} tMeta={tMeta} points={scripts[tMeta.code]?.summary ?? []} onRestart={reset} />
                )}
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 1. language (D-01) */
function LangStep({
  dict,
  locales,
  picked,
  onPick,
}: {
  dict: Dictionary["demo"];
  locales: LocaleListItem[];
  picked: string | null;
  onPick: (code: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <h3 className="phone-title">{dict.lang.title}</h3>
      <p className="mt-1.5 text-[0.9rem] leading-snug text-muted">{dict.lang.hint}</p>
      <ul className="no-scrollbar mt-4 grid min-h-0 flex-1 list-none auto-rows-min grid-cols-2 content-start gap-2 overflow-y-auto overscroll-contain p-0">
        {locales.map((l) => (
          <li key={l.code}>
            <button type="button" className="phone-lang" aria-pressed={picked === l.code} onClick={() => onPick(l.code)} lang={l.htmlLang}>
              <span dir={l.dir} data-names={l.code} className="phone-lang__name">
                {l.nativeName}
              </span>
              <span className="phone-lang__code" aria-hidden>
                {l.code}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- 2. voice check (D-02) */
function VoiceStep({ dict, onConfirm }: { dict: Dictionary["demo"]; onConfirm: () => void }) {
  const level = useRef(0.25);
  const [found, setFound] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    setFound(false);
    let locked = false;
    const tick = setInterval(() => {
      const goal = locked ? 0.38 : 0.6 + Math.random() * 0.4;
      level.current += (goal - level.current) * 0.4;
    }, 70);
    const done = setTimeout(() => {
      locked = true;
      setFound(true);
    }, 2600);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [round]);

  return (
    <div className="flex h-full flex-col">
      <h3 className="phone-title">{dict.voice.title}</h3>

      <div className="voice-card mt-5">
        <div className="flex items-center gap-2 text-[0.85rem] font-semibold text-muted">
          <span className="voice-mic" aria-hidden>
            <Microphone size={16} weight="fill" />
          </span>
          {dict.voice.speaker}
        </div>
        <div className="relative mt-3 h-[112px]">
          <WaveCanvas className="absolute inset-0 size-full" levelRef={level} amp={0.95} weight={0.085} speed={1.25} seed={2} />
        </div>
        <p className="mt-3 flex min-h-[1.6rem] items-center gap-2 text-[0.95rem] font-medium" aria-live="polite">
          {found ? (
            <>
              <CheckCircle size={20} weight="fill" className="shrink-0 text-gold" aria-hidden />
              <span>{dict.voice.found}</span>
            </>
          ) : (
            <span className="text-muted">{dict.voice.scanning}</span>
          )}
        </p>
      </div>

      <p className="mt-4 text-[0.88rem] leading-snug text-muted">{dict.voice.hint}</p>

      <div className="mt-auto flex flex-col gap-2.5 pt-5">
        <button type="button" className="btn btn-primary w-full" disabled={!found} onClick={onConfirm}>
          {dict.voice.confirm}
        </button>
        <button type="button" className="phone-link" onClick={() => setRound((r) => r + 1)}>
          {dict.voice.replay}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 3. live listening (D-03, D-04, D-05) */
function LiveStep({
  dict,
  tMeta,
  sMeta,
  tLines,
  sLines,
  audioOn,
  subsOn,
  dim,
  onAudio,
  onSubs,
  onDim,
  onDone,
}: {
  dict: Dictionary["demo"];
  tMeta: LocaleListItem;
  sMeta: LocaleListItem;
  tLines: string[];
  sLines: string[];
  audioOn: boolean;
  subsOn: boolean;
  dim: boolean;
  onAudio: () => void;
  onSubs: () => void;
  onDim: (v: boolean) => void;
  onDone: () => void;
}) {
  const same = tMeta.code === sMeta.code; // the speaker already speaks the listener's language
  const pairs = useMemo<Pair[]>(() => tLines.map((t, i) => ({ o: graphemes(sLines[i] ?? ""), t: graphemes(t) })), [tLines, sLines]);
  const tl = useMemo(() => buildTimeline(pairs, same, tMeta.font.startsWith("cjk") ? 72 : 30), [pairs, same, tMeta.font]);
  const [prog, setProg] = useState<Progress>({ line: 0, o: 0, t: 0, done: false });
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    let last = "";
    const frame = (now: number) => {
      const p = reduce ? progressAt(tl.total, tl, pairs) : progressAt(now - start, tl, pairs);
      const key = `${p.line}|${p.o}|${p.t}|${p.done}`;
      if (key !== last) {
        last = key;
        setProg(p);
      }
      if (!p.done) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [tl, pairs]);

  useEffect(() => {
    if (!prog.done) return;
    const id = setTimeout(onDone, 1700);
    return () => clearTimeout(id);
  }, [prog.done, onDone]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [prog]);

  const shown = (i: number, g: string[], n: number) => (prog.done || i < prog.line ? g : g.slice(0, n)).join("");
  const typingO = !same && !prog.done && prog.o < (pairs[prog.line]?.o.length ?? 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[0.88rem] font-semibold">{dict.live.session}</p>
        <span className="live-pill" data-ended={prog.done}>
          {!prog.done && <i aria-hidden />}
          {prog.done ? dict.summary.ended : dict.live.liveLabel}
        </span>
      </div>

      {audioOn && (
        <div className="audio-block anim-pop mt-3">
          <span className="audio-block__icon" aria-hidden>
            <SpeakerHigh size={18} weight="fill" />
          </span>
          <div className="h-7 min-w-0 flex-1">
            <div className="eq" data-paused={prog.done} aria-hidden>
              {Array.from({ length: 30 }, (_, i) => (
                <span key={i} style={{ ["--i" as string]: i }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {same && subsOn && <p className="mt-3 rounded-2xl bg-white/[0.06] px-3.5 py-2.5 text-[0.85rem] leading-snug text-muted">{dict.live.sameLang}</p>}

      <div ref={scroller} className="transcript no-scrollbar mt-3" data-hidden={!subsOn}>
        {subsOn ? (
          pairs.map((p, i) =>
            prog.done || i <= prog.line ? (
              <div key={i} className="pair">
                {!same && (
                  <p className={`orig${typingO && i === prog.line ? " caret" : ""}`} lang={sMeta.htmlLang} dir={sMeta.dir} data-font={sMeta.font}>
                    {i === 0 && <span className="pair__tag">{dict.live.original} · {dict.live.sourceLang}</span>}
                    {shown(i, p.o, prog.o)}
                  </p>
                )}
                <p
                  className={`trans${!typingO && !prog.done && i === prog.line ? " caret" : ""}`}
                  lang={tMeta.htmlLang}
                  dir={tMeta.dir}
                  data-font={tMeta.font}
                >
                  {i === 0 && <span className="pair__tag pair__tag--gold">{dict.live.translation} · {tMeta.nativeName}</span>}
                  {shown(i, p.t, prog.t)}
                </p>
              </div>
            ) : null,
          )
        ) : (
          !audioOn && <p className="m-auto max-w-[16rem] text-center text-[0.9rem] text-muted">{dict.live.bothOff}</p>
        )}
      </div>

      <div className="ctl-bar mt-3">
        <button type="button" className="ctl" aria-pressed={audioOn} onClick={onAudio}>
          <SpeakerHigh size={20} weight={audioOn ? "fill" : "regular"} aria-hidden />
          <span>{dict.live.audio}</span>
        </button>
        <button type="button" className="ctl" aria-pressed={subsOn} onClick={onSubs}>
          <ClosedCaptioning size={20} weight={subsOn ? "fill" : "regular"} aria-hidden />
          <span>{dict.live.subtitles}</span>
        </button>
        <button type="button" className="ctl" aria-pressed={dim} onClick={() => onDim(true)}>
          <MoonStars size={20} weight={dim ? "fill" : "regular"} aria-hidden />
          <span>{dict.live.background}</span>
        </button>
      </div>

      {/* D-05: background mode. The screen dims, audio "keeps going", one tap restores. */}
      <button type="button" className="dim-overlay" data-open={dim} inert={!dim} onClick={() => onDim(false)} aria-label={dict.background.hint}>
        <span className="h-10 w-28">
          <span className="eq" aria-hidden data-paused={prog.done}>
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ ["--i" as string]: i }} />
            ))}
          </span>
        </span>
        <span className="mt-4 font-display text-[1.15rem] font-[var(--w-display)]">{dict.background.title}</span>
        <span className="mt-1.5 max-w-[14rem] text-[0.88rem] text-muted">{dict.background.hint}</span>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- 4. auto-summary (D-06) */
function SummaryStep({
  dict,
  tMeta,
  points,
  onRestart,
}: {
  dict: Dictionary["demo"];
  tMeta: LocaleListItem;
  points: string[];
  onRestart: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="summary-card" lang={tMeta.htmlLang} dir={tMeta.dir} data-font={tMeta.font}>
        <span className="summary-badge">
          <Sparkle size={14} weight="fill" aria-hidden />
          {dict.summary.badge}
        </span>
        <h3 className="phone-title mt-3">{dict.summary.title}</h3>
        <ul className="mt-4 flex list-none flex-col gap-3.5 p-0">
          {points.map((p, i) => (
            <m.li
              key={i}
              className="flex items-start gap-3 text-[0.95rem] leading-snug"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.16, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-gold" aria-hidden />
              <span>{p}</span>
            </m.li>
          ))}
        </ul>
      </div>
      <button type="button" className="btn btn-primary mt-auto w-full" onClick={onRestart}>
        <ArrowClockwise size={20} weight="bold" aria-hidden />
        {dict.summary.restart}
      </button>
    </div>
  );
}
