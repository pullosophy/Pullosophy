import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireCustomer, logout } from "@/app/actions/account";
import { orderNumber } from "@/lib/email-templates";
import { formatPrice } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { SafeImage } from "@/components/safe-image";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.account.title, robots: { index: false } };
}

// "Il mio account": elenco ordini del cliente con i prodotti acquistati.
export default async function AccountPage() {
  const [{ locale, t }, customer] = await Promise.all([getT(), requireCustomer()]);
  const orders = await db.order.findMany({
    where: { customerId: customer.id, status: { not: "PENDING" } },
    include: { items: { include: { listing: { include: { card: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const a = t.account;
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "it-IT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{a.kicker}</p>
          <h1 className="font-display mt-2 text-6xl">{a.title}</h1>
          <p className="mt-2 text-black/70">
            {a.hello} <strong>{customer.name || customer.email}</strong>
            {customer.name && <span className="text-black/50"> · {customer.email}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/account/dati" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-brand">
            {a.profile.title}
          </Link>
          <form action={logout}>
            <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-foreground">{a.logout}</button>
          </form>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-4xl">{a.orders}</h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-muted p-8 text-center">
            <p className="text-black/60">{a.noOrders}</p>
            <Link href="/pokemon" className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              {a.shopNow}
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-line p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/account/ordini/${o.id}`} className="text-lg font-semibold hover:text-brand">
                    {a.order} {orderNumber(o.id)}
                  </Link>
                  <span className="text-sm text-black/50">{dateFmt.format(o.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{a.status[o.status]}</span>
                  <span className="ml-2 text-black/60">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} {a.itemsCount} · {formatPrice(o.totalCents)}
                  </span>
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {o.items.slice(0, 6).map((i) => {
                    const img = i.listing.images[0] ?? i.listing.card?.imageSmall ?? null;
                    return (
                      <div key={i.id} className="h-16 w-12 shrink-0 overflow-hidden rounded bg-muted" title={i.titleSnapshot}>
                        {img && <SafeImage src={img} alt="" className="h-full w-full object-contain" />}
                      </div>
                    );
                  })}
                  {o.items.length > 6 && <span className="self-center text-sm text-black/50">+{o.items.length - 6}</span>}
                </div>
                <Link href={`/account/ordini/${o.id}`} className="mt-3 inline-block text-sm font-semibold hover:text-brand">
                  {a.viewOrder} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
