import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { getCustomer } from "@/lib/customer-auth";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.account.loginTitle, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { t }, customer] = await Promise.all([searchParams, getT(), getCustomer()]);
  if (customer) redirect("/account");
  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{t.account.kicker}</p>
        <h1 className="font-display mt-2 text-6xl">{t.account.loginTitle}</h1>
        <p className="mt-3 text-black/70">{t.account.loginIntro}</p>
      </div>
      <AccountForm mode="login" t={t.account} next={next} />
    </div>
  );
}
