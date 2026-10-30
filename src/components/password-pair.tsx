"use client";

import { useState } from "react";

// Coppia "Password" + "Ripeti password" per registrazione e cambio password.
// Il controllo qui e' solo un aiuto immediato: quello che conta lo rifa' il server (errore "mismatch").
export function PasswordPair({
  labels,
  className,
}: {
  labels: { password: string; repeat: string; hint?: string; mismatch: string };
  className: string;
}) {
  const [pwd, setPwd] = useState("");
  const [repeat, setRepeat] = useState("");
  const mismatch = repeat.length > 0 && pwd !== repeat;
  return (
    <>
      <label className="block text-sm">
        <span className="font-semibold">{labels.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className={className}
        />
        {labels.hint && <span className="mt-1 block text-xs text-black/50">{labels.hint}</span>}
      </label>
      <label className="block text-sm">
        <span className="font-semibold">{labels.repeat}</span>
        <input
          name="passwordRepeat"
          type="password"
          required
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          aria-invalid={mismatch || undefined}
          className={`${className} ${mismatch ? "border-brand" : ""}`}
        />
        {mismatch && <span className="mt-1 block text-xs text-brand">{labels.mismatch}</span>}
      </label>
    </>
  );
}
