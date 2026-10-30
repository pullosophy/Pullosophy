import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireCustomer, type Address } from "@/app/actions/account";
import { DeleteForm, PasswordForm, ProfileForm } from "@/components/profile-forms";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.account.profile.title, robots: { index: false } };
}

// "I miei dati": nome, telefono, indirizzo predefinito, cambio password, eliminazione account.
export default async function ProfilePage() {
  const [{ locale, t }, customer] = await Promise.all([getT(), requireCustomer()]);
  const zones = await db.shippingZone.findMany();
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const countries = [...new Set(zones.flatMap((z) => z.countries))]
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => (a.code === "IT" ? -1 : b.code === "IT" ? 1 : a.name.localeCompare(b.name)));
  const p = t.account.profile;
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <Link href="/account" className="text-sm font-semibold hover:text-brand">← {t.account.backToAccount}</Link>
        <h1 className="font-display mt-2 text-6xl">{p.title}</h1>
        <p className="mt-2 text-black/70">{p.intro}</p>
      </div>
      <section className="space-y-4">
        <h2 className="font-display text-3xl">{p.dataTitle}</h2>
        <ProfileForm
          t={p}
          countries={countries}
          initial={{ name: customer.name ?? "", phone: customer.phone ?? "", address: (customer.address as Address | null) ?? null }}
        />
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-3xl">{p.passwordTitle}</h2>
        <PasswordForm t={p} />
      </section>
      <section className="space-y-4 rounded-2xl border border-brand/30 p-5">
        <h2 className="font-display text-3xl text-brand">{p.deleteTitle}</h2>
        <DeleteForm t={p} />
      </section>
    </div>
  );
}
