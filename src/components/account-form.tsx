"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type AccountFormState } from "@/app/actions/account";
import type { Dictionary } from "@/lib/i18n";

type Props = { mode: "login" | "register"; t: Dictionary["account"]; next?: string; initialEmail?: string };

// Form di accesso / registrazione: stesso componente, cambia l'azione e i campi.
export function AccountForm({ mode, t, next, initialEmail }: Props) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(mode === "login" ? login : register, {});
  const field = "mt-1 w-full rounded-xl border border-line bg-white px-4 py-3";
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "register" && (
        <label className="block text-sm">
          <span className="font-semibold">{t.name}</span>
          <input name="name" autoComplete="name" defaultValue={state.name ?? ""} className={field} />
        </label>
      )}
      <label className="block text-sm">
        <span className="font-semibold">{t.email}</span>
        <input name="email" type="email" required autoComplete="email" defaultValue={state.email ?? initialEmail ?? ""} className={field} />
      </label>
      <label className="block text-sm">
        <span className="font-semibold">{t.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={field}
        />
        {mode === "register" && <span className="mt-1 block text-xs text-black/50">{t.passwordHint}</span>}
      </label>
      {state.error && <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm">{t.errors[state.error]}</p>}
      <button disabled={pending} className="w-full rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? t.pending : mode === "login" ? t.loginButton : t.registerButton}
      </button>
      <p className="text-center text-sm text-black/60">
        {mode === "login" ? (
          <>
            {t.noAccount} <Link href="/registrati" className="font-semibold text-foreground underline">{t.registerLink}</Link>
          </>
        ) : (
          <>
            {t.haveAccount} <Link href="/accedi" className="font-semibold text-foreground underline">{t.loginLink}</Link>
          </>
        )}
      </p>
    </form>
  );
}
