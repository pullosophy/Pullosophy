import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { findOrder } from "@/app/actions/orders";
import { orderNumber } from "@/lib/email-templates";
import { company } from "@/lib/company";
import { formatPrice } from "@/lib/format";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.trackPage.title, description: t.trackPage.metaDescription, robots: { index: false } };
}

type Address = { name?: string; address?: Record<string, string | null> };
const stepIndex: Record<OrderStatus, number> = { PENDING: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: -1, REFUNDED: -1 };

// Pagina "Dov'e' il mio ordine": form GET (cosi' il link nelle email arriva gia' compilato).
export default async function TrackPage({ searchParams }: { searchParams: Promise<{ n?: string; email?: string }> }) {
  const [{ n = "", email = "" }, { locale, t }] = await Promise.all([searchParams, getT()]);
  const tp = t.trackPage;
  const searched = Boolean(n && email);
  const order = searched ? await findOrder(n, email) : null;
  const ship = order?.shippingAddress as Address | null;
  const a = ship?.address;
  const current = order ? stepIndex[order.status] : -1;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{t.infoKicker}</p>
        <h1 className="font-display mt-2 text-6xl">{tp.title}</h1>
        <p className="mt-3 text-black/70">{tp.intro}</p>
      </div>

      <form className="grid gap-3 rounded-2xl bg-muted p-5 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">{tp.number}</span>
          <input name="n" defaultValue={n} required placeholder="A1B2C3D4" className="w-full rounded-full border border-line bg-white px-4 py-3 uppercase" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">{tp.email}</span>
          <input name="email" type="email" defaultValue={email} required className="w-full rounded-full border border-line bg-white px-4 py-3" />
        </label>
        <button className="self-end rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">{tp.button}</button>
      </form>

      {searched && !order && <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm">{tp.notFound}</p>}

      {order && (
        <section className="space-y-6 rounded-2xl border border-line p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold">
              {tp.order} {orderNumber(order.id)}
            </h2>
            <p className="text-sm text-black/50">
              {tp.placedOn} {order.createdAt.toLocaleDateString(locale === "en" ? "en-GB" : "it-IT", { day: "numeric", month: "long", year: "numeric" })}
            </p>
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

          {order.status === "SHIPPED" || order.status === "DELIVERED" ? (
            order.trackingNumber ? (
              <div className="rounded-xl bg-muted p-4 text-sm">
                <p className="text-black/50">{tp.tracking}</p>
                <p className="text-xl font-semibold tracking-wider">{order.trackingNumber}</p>
                <p className="mt-1 text-black/60">{tp.trackingHint}</p>
              </div>
            ) : null
          ) : (
            order.status === "PAID" && <p className="text-sm text-black/60">{tp.noTracking}</p>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="text-sm">
              <p className="mb-2 font-semibold">{tp.items}</p>
              <ul className="space-y-1">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>
                      {i.quantity} × {i.titleSnapshot}
                    </span>
                    <span className="whitespace-nowrap">{formatPrice(i.unitPriceCents * i.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-line pt-1 font-semibold">
                  <span>{tp.total}</span>
                  <span>{formatPrice(order.totalCents)}</span>
                </li>
              </ul>
            </div>
            {a && (
              <div className="text-sm">
                <p className="mb-2 font-semibold">{tp.shipTo}</p>
                <p className="text-black/70">
                  {ship?.name && <>{ship.name}<br /></>}
                  {a.line1}
                  {a.line2 && <>, {a.line2}</>}
                  <br />
                  {[a.postal_code, a.city, a.state].filter(Boolean).join(" ")}, {a.country}
                </p>
              </div>
            )}
          </div>

          <p className="text-sm text-black/60">
            {tp.help} <a href={`mailto:${company.email}`} className="underline">{company.email}</a>
          </p>
        </section>
      )}

      <p className="text-sm">
        {order && (
          <Link href="/ordine/traccia" className="mr-4 underline">{tp.searchAgain}</Link>
        )}
        <Link href="/" className="underline">{t.thanks.back}</Link>
      </p>
    </div>
  );
}
