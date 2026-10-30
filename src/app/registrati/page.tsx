import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { getCustomer } from "@/lib/customer-auth";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.account.registerTitle, robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const [{ email }, { t }, customer] = await Promise.all([searchParams, getT(), getCustomer()]);
  if (customer) redirect("/account");
  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{t.account.kicker}</p>
        <h1 className="font-display mt-2 text-6xl">{t.account.registerTitle}</h1>
        <p className="mt-3 text-black/70">{t.account.registerIntro}</p>
        <ul className="mt-3 space-y-1 text-sm text-black/70">
          {t.account.perks.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-brand">✓</span> {p}
            </li>
          ))}
        </ul>
      </div>
      <AccountForm mode="register" t={t.account} initialEmail={email} />
    </div>
  );
}
