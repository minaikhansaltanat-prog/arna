"use client";

import { useId, useRef, useState } from "react";
import { CaretDown, CheckCircle, WhatsappLogo } from "@phosphor-icons/react";
import type { Dictionary } from "@arna/i18n";
import { LEAD_ENDPOINT, STORAGE, waLink } from "@/lib/site";

type Values = { name: string; contact: string; type: string };
type Errors = Partial<Record<keyof Values, true>>;
type Status = "idle" | "sending" | "sent" | "draft";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validContact = (v: string) => EMAIL.test(v.trim()) || v.replace(/\D/g, "").length >= 6 || /^@\w{3,}$/.test(v.trim());

/**
 * Pilot sign-up (TZ 5.4, C-01..C-03). No database.
 *  - With NEXT_PUBLIC_LEAD_ENDPOINT set: the lead is POSTed there (any form connector / webhook).
 *  - Otherwise (or if that fails): a ready WhatsApp message is prepared for the team's number.
 * The last request is also kept in this browser's localStorage, so nothing is lost if a tab is closed.
 */
export function PilotForm({ dict, lang, langName }: { dict: Dictionary["pilot"]; lang: string; langName: string }) {
  const uid = useId();
  const [values, setValues] = useState<Values>({ name: "", contact: "", type: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [draftUrl, setDraftUrl] = useState("");
  const refs = { name: useRef<HTMLInputElement>(null), contact: useRef<HTMLInputElement>(null), type: useRef<HTMLSelectElement>(null) };

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const options = dict.fields.type.options as Record<string, string>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const next: Errors = {};
    if (values.name.trim().length < 2) next.name = true;
    if (!validContact(values.contact)) next.contact = true;
    if (!options[values.type]) next.type = true;
    setErrors(next);
    const first = (["name", "contact", "type"] as const).find((k) => next[k]);
    if (first) {
      refs[first].current?.focus();
      return;
    }

    const typeLabel = options[values.type];
    const message = dict.message
      .replace("{name}", values.name.trim())
      .replace("{contact}", values.contact.trim())
      .replace("{type}", typeLabel)
      .replace("{lang}", `${langName} (${lang})`);
    try {
      localStorage.setItem(STORAGE.lead, JSON.stringify({ ...values, typeLabel, lang, at: new Date().toISOString() }));
    } catch {}

    setStatus("sending");
    if (LEAD_ENDPOINT) {
      try {
        const res = await fetch(LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: values.name.trim(), contact: values.contact.trim(), eventType: values.type, eventTypeLabel: typeLabel, language: lang, page: location.href, message }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus("sent");
        return;
      } catch {
        /* connector unreachable: fall back to the WhatsApp draft so the lead is not lost */
      }
    }
    const url = waLink(message);
    window.open(url, "_blank", "noopener,noreferrer");
    setDraftUrl(url);
    setStatus("draft");
  };

  if (status === "sent" || status === "draft") {
    return (
      <div className="flex min-h-[22rem] flex-col items-start justify-center gap-4" role="status">
        <span className="grid size-14 place-items-center rounded-full bg-gold/15 text-accent">
          <CheckCircle size={34} weight="fill" aria-hidden />
        </span>
        <h3 className="text-[1.6rem]">{dict.success.title}</h3>
        <p className="max-w-[26rem] text-muted">{status === "sent" ? dict.success.sent : dict.success.draft}</p>
        {status === "draft" && (
          <a href={draftUrl} target="_blank" rel="noopener noreferrer" className="btn btn-wa mt-2">
            <WhatsappLogo size={22} weight="fill" aria-hidden />
            {dict.success.open}
          </a>
        )}
      </div>
    );
  }

  const fid = (k: string) => `${uid}-${k}`;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor={fid("name")} className="field-label">
          {dict.fields.name.label}
        </label>
        <input
          ref={refs.name}
          id={fid("name")}
          name="name"
          type="text"
          autoComplete="name"
          className="field"
          value={values.name}
          onChange={set("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? fid("name-err") : undefined}
        />
        {errors.name && (
          <p id={fid("name-err")} className="field-error" role="alert">
            {dict.fields.name.error}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={fid("contact")} className="field-label">
          {dict.fields.contact.label}
        </label>
        <input
          ref={refs.contact}
          id={fid("contact")}
          name="contact"
          type="text"
          autoComplete="off"
          className="field"
          dir="auto"
          value={values.contact}
          onChange={set("contact")}
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={`${fid("contact-hint")}${errors.contact ? ` ${fid("contact-err")}` : ""}`}
        />
        <p id={fid("contact-hint")} className="field-hint">
          {dict.fields.contact.hint}
        </p>
        {errors.contact && (
          <p id={fid("contact-err")} className="field-error" role="alert">
            {dict.fields.contact.error}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={fid("type")} className="field-label">
          {dict.fields.type.label}
        </label>
        <div className="relative">
          <select
            ref={refs.type}
            id={fid("type")}
            name="type"
            className="field appearance-none pe-12"
            value={values.type}
            onChange={set("type")}
            aria-invalid={errors.type ? true : undefined}
            aria-describedby={errors.type ? fid("type-err") : undefined}
          >
            <option value="" disabled>
              {dict.fields.type.choose}
            </option>
            {Object.entries(options).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <CaretDown size={18} weight="bold" aria-hidden className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-muted" />
        </div>
        {errors.type && (
          <p id={fid("type-err")} className="field-error" role="alert">
            {dict.fields.type.error}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary mt-1 w-full" disabled={status === "sending"}>
        {status === "sending" ? dict.sending : dict.submit}
      </button>
      <p className="text-center text-[0.85rem] text-muted">{dict.privacy}</p>
    </form>
  );
}
