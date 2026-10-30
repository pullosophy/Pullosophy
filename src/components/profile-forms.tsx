"use client";

import { useActionState } from "react";
import {
  changePassword,
  deleteAccount,
  updateProfile,
  type Address,
  type DeleteFormState,
  type PasswordFormState,
  type ProfileFormState,
} from "@/app/actions/account";
import type { Dictionary } from "@/lib/i18n";

type Country = { code: string; name: string };
type P = Dictionary["account"]["profile"];
const field = "mt-1 w-full rounded-xl border border-line bg-white px-4 py-3";
const button = "rounded-full bg-foreground px-6 py-3 font-semibold text-white hover:bg-brand disabled:opacity-60";

export function ProfileForm({ t, countries, initial }: { t: P; countries: Country[]; initial: { name: string; phone: string; address: Address | null } }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});
  const a = initial.address;
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold">{t.name}</span>
          <input name="name" autoComplete="name" defaultValue={initial.name} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">{t.phone}</span>
          <input name="phone" type="tel" autoComplete="tel" defaultValue={initial.phone} className={field} />
        </label>
      </div>
      <fieldset className="space-y-3 rounded-2xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold">{t.addressTitle}</legend>
        <p className="text-xs text-black/50">{t.addressHint}</p>
        <label className="block text-sm">
          <span>{t.line1}</span>
          <input name="line1" autoComplete="shipping address-line1" defaultValue={a?.line1 ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span>{t.line2}</span>
          <input name="line2" autoComplete="shipping address-line2" defaultValue={a?.line2 ?? ""} className={field} />
        </label>
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr_6rem]">
          <label className="block text-sm">
            <span>{t.postalCode}</span>
            <input name="postalCode" autoComplete="shipping postal-code" defaultValue={a?.postalCode ?? ""} className={field} />
          </label>
          <label className="block text-sm">
            <span>{t.city}</span>
            <input name="city" autoComplete="shipping address-level2" defaultValue={a?.city ?? ""} className={field} />
          </label>
          <label className="block text-sm">
            <span>{t.state}</span>
            <input name="state" autoComplete="shipping address-level1" defaultValue={a?.state ?? ""} className={field} />
          </label>
        </div>
        <label className="block text-sm">
          <span>{t.country}</span>
          <select name="country" autoComplete="shipping country" defaultValue={a?.country ?? "IT"} className={field}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>
      </fieldset>
      {state.error && <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm">{t.errors[state.error]}</p>}
      {state.saved && !state.error && <p className="rounded-xl bg-green-600/10 px-4 py-3 text-sm">{t.saved}</p>}
      <button disabled={pending} className={button}>{pending ? t.pending : t.save}</button>
    </form>
  );
}

export function PasswordForm({ t }: { t: P }) {
  const [state, action, pending] = useActionState<PasswordFormState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm">
        <span className="font-semibold">{t.currentPassword}</span>
        <input name="current" type="password" required autoComplete="current-password" className={field} />
      </label>
      <label className="block text-sm">
        <span className="font-semibold">{t.newPassword}</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </label>
      {state.error && <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm">{t.errors[state.error]}</p>}
      {state.saved && !state.error && <p className="rounded-xl bg-green-600/10 px-4 py-3 text-sm">{t.passwordSaved}</p>}
      <button disabled={pending} className={button}>{pending ? t.pending : t.changePassword}</button>
    </form>
  );
}

export function DeleteForm({ t }: { t: P }) {
  const [state, action, pending] = useActionState<DeleteFormState, FormData>(deleteAccount, {});
  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={(e) => {
        if (!confirm(t.deleteConfirm)) e.preventDefault();
      }}
    >
      <p className="text-sm text-black/70">{t.deleteText}</p>
      <label className="block text-sm">
        <span className="font-semibold">{t.currentPassword}</span>
        <input name="current" type="password" required autoComplete="current-password" className={field} />
      </label>
      {state.error && <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm">{t.errors[state.error]}</p>}
      <button disabled={pending} className="rounded-full border border-brand px-6 py-3 font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-60">
        {pending ? t.pending : t.deleteButton}
      </button>
    </form>
  );
}
