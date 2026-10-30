import Link from "next/link";
import { getT } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.thanks.title };
}

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const [{ id }, { t }, customer] = await Promise.all([searchParams, getT(), getCustomer()]);
  const order = id ? await db.order.findUnique({ where: { id }, select: { email: true } }) : null;
  return (
    <div className="space-y-3">
      <h1 className="font-display text-6xl">{t.thanks.title}</h1>
      <p>{t.thanks.text}</p>
      {id && <p className="text-sm opacity-70">{t.thanks.orderNumber} {id}</p>}
      {!customer && order && (
        <div className="mt-4 rounded-2xl bg-muted p-5">
          <p className="font-semibold">{t.thanks.accountTitle}</p>
          <p className="mt-1 text-sm text-black/70">{t.thanks.accountText}</p>
          <Link href={`/registrati?email=${encodeURIComponent(order.email)}`} className="mt-3 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            {t.thanks.accountButton}
          </Link>
        </div>
      )}
      {customer && <p className="text-sm"><Link href="/account" className="underline">{t.thanks.seeInAccount}</Link></p>}
      <p className="flex flex-wrap gap-4">
        <Link href="/ordine/traccia" className="underline">{t.thanks.track}</Link>
        <Link href="/" className="underline">{t.thanks.back}</Link>
      </p>
    </div>
  );
}
