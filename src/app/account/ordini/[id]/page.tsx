import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCustomer } from "@/app/actions/account";
import { orderNumber } from "@/lib/email-templates";
import { formatPrice } from "@/lib/format";
import { company } from "@/lib/company";
import { getT } from "@/lib/i18n";
import { SafeImage } from "@/components/safe-image";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.account.order, robots: { index: false } };
}

type Address = { name?: string; address?: Record<string, string | null> };
const stepIndex: Record<OrderStatus, number> = { PENDING: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: -1, REFUNDED: -1 };

// Dettaglio di un ordine del cliente: prodotti acquistati, stato, tracking, indirizzo.
export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { locale, t }, customer] = await Promise.all([params, getT(), requireCustomer()]);
  const order = await db.order.findFirst({
    where: { id, customerId: customer.id },
    include: { items: { include: { listing: { include: { card: true, game: true } } } } },
  });
  if (!order) notFound();
  const a = t.account;
  const tp = t.trackPage;
  const ship = order.shippingAddress as Address | null;
  const addr = ship?.address;
  const current = stepIndex[order.status];
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "it-IT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/account" className="text-sm font-semibold hover:text-brand">← {a.backToAccount}</Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-5xl">
          {a.order} {orderNumber(order.id)}
        </h1>
        <p className="text-sm text-black/50">{tp.placedOn} {dateFmt.format(order.createdAt)}</p>
      </div>

      {current >= 0 && (
        <ol className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
          {tp.steps.map((label, i) => (
            <li key={label} className="space-y-2">
              <div className={`h-2 rounded-full ${i <= current ? "bg-brand" : "bg-muted"}`} />
              <span className={i <= current ? "font-semibold" : "text-black/40"}>{label}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-lg font-semibold">{tp.status[order.status]}</p>

      {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="text-black/50">{tp.tracking}</p>
          {order.trackingNumber ? (
            <>
              <p className="text-xl font-semibold tracking-wider">{order.trackingNumber}</p>
              <p className="mt-1 text-black/60">{tp.trackingHint}</p>
            </>
          ) : (
            <p>{tp.noTracking}</p>
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-3xl">{tp.items}</h2>
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {order.items.map((i) => {
            const img = i.listing.images[0] ?? i.listing.card?.imageSmall ?? null;
            return (
              <li key={i.id} className="flex items-center gap-4 p-4">
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-muted">
                  {img && <SafeImage src={img} alt="" className="h-full w-full object-contain" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/${i.listing.game.slug}/p/${i.listing.id}`} className="font-medium hover:text-brand">
                    {i.titleSnapshot}
                  </Link>
                  <p className="text-sm text-black/50">
                    {i.quantity} × {formatPrice(i.unitPriceCents)}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(i.unitPriceCents * i.quantity)}</p>
              </li>
            );
          })}
        </ul>
        <div className="space-y-1 text-right text-sm">
          <p>{t.cart.subtotal}: {formatPrice(order.subtotalCents)}</p>
          <p>{t.cart.shippingTitle}: {formatPrice(order.shippingCents)}</p>
          <p className="text-lg font-semibold">{tp.total}: {formatPrice(order.totalCents)}</p>
        </div>
      </section>

      {addr && (
        <section className="rounded-xl bg-muted p-4 text-sm">
          <p className="text-black/50">{tp.shipTo}</p>
          <p className="font-medium">{ship?.name}</p>
          <p>{[addr.line1, addr.line2].filter(Boolean).join(", ")}</p>
          <p>{[addr.postal_code, addr.city, addr.state].filter(Boolean).join(" ")} {addr.country}</p>
        </section>
      )}

      <p className="text-sm text-black/60">
        {tp.help} <a href={`mailto:${company.email}`} className="underline">{company.email}</a>
      </p>
    </div>
  );
}
