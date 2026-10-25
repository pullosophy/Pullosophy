"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { subscribe, type SubscribeState } from "@/app/actions/newsletter";

const KEY = "pullosophy-welcome";
const DAYS = 30;

type Labels = {
  kicker: string;
  title: string;
  text: string;
  placeholder: string;
  button: string;
  consent: string;
  close: string;
  doneTitle: string;
  doneText: string;
  copy: string;
  copied: string;
  errorEmail: string;
  errorGeneric: string;
};

// Pop-up di benvenuto: compare dopo qualche secondo alla prima visita, poi tace per 30 giorni.
export function WelcomePopup({ labels, percent }: { labels: Labels; percent: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, {});

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/carrello") || pathname.startsWith("/ordine")) return;
    try {
      const until = Number(localStorage.getItem(KEY) ?? 0);
      if (until > Date.now()) return;
    } catch {}
    const id = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(id);
  }, [pathname]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, String(Date.now() + DAYS * 86400000));
    } catch {}
  };

  // Dopo l'iscrizione non lo mostriamo più (un anno).
  useEffect(() => {
    if (state.ok) {
      try {
        localStorage.setItem(KEY, String(Date.now() + 365 * 86400000));
      } catch {}
    }
  }, [state.ok]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={dismiss} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-brand px-6 pb-8 pt-6 text-white">
          <button type="button" onClick={dismiss} aria-label={labels.close} className="absolute right-4 top-4 text-2xl leading-none text-white/80 hover:text-white">
            ×
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">{labels.kicker}</p>
          <p className="font-display mt-2 text-6xl leading-none">-{percent}%</p>
          <p className="font-display text-3xl">{labels.title}</p>
        </div>
        <div className="space-y-4 p-6">
          {state.ok ? (
            <div className="space-y-3 text-center">
              <p className="font-semibold">{labels.doneTitle}</p>
              <p className="text-sm text-black/60">{labels.doneText}</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(state.code ?? "").then(() => setCopied(true)).catch(() => {});
                }}
                className="w-full rounded-2xl border-2 border-dashed border-brand bg-brand/5 px-4 py-3 font-display text-3xl tracking-widest text-brand"
              >
                {state.code}
              </button>
              <p className="text-xs text-black/50">{copied ? labels.copied : labels.copy}</p>
              <button type="button" onClick={dismiss} className="text-sm font-semibold underline">{labels.close}</button>
            </div>
          ) : (
            <form action={action} className="space-y-3">
              <p className="text-sm text-black/70">{labels.text}</p>
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder={labels.placeholder}
                className="w-full rounded-full border border-line px-4 py-3 outline-none focus:border-foreground"
              />
              {state.error && <p className="text-sm text-brand">{state.error === "email" ? labels.errorEmail : labels.errorGeneric}</p>}
              <button disabled={pending} className="w-full rounded-full bg-foreground px-5 py-3 font-semibold text-white hover:bg-brand disabled:opacity-60">
                {pending ? "…" : labels.button}
              </button>
              <p className="text-center text-[11px] leading-snug text-black/50">{labels.consent}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
