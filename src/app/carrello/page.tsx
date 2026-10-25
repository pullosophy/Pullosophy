import Link from "next/link";
import { db } from "@/lib/db";
import { cartLines } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { setQuantity } from "@/app/actions/cart";
import { startCheckout } from "@/app/actions/checkout";
import { getT } from "@/lib/i18n";
import { SafeImage } from "@/components/safe-image";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.cart.title };
}

export default async function CartPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const [{ errore }, { locale, t }, lines] = await Promise.all([searchParams, getT(), cartLines()]);
  const countryNames = new Intl.DisplayNames([locale], { type: "region" });
  if (lines.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-6xl">{t.cart.title}</h1>
        <p className="opacity-70">{t.cart.empty}</p>
        <Link href="/pokemon" className="underline">{t.cart.goCatalog}</Link>
      </div>
    );
  }

  const zones = await db.shippingZone.findMany();
  const countries = zones
    .flatMap((z) => z.countries)
    .map((code) => ({ code, name: countryNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  const subtotal = lines.reduce((sum, l) => sum + l.listing.priceCents * l.quantity, 0);
  const zoneList = [...zones].sort((a, b) => a.baseCents - b.baseCents);
  const thumb = (l: (typeof lines)[number]["listing"]) =>
    l.images[0] ?? l.card?.imageSmall ?? (l.kind === "SEALED" ? l.set?.logoUrl : null) ?? null;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-6xl">{t.cart.title}</h1>
      {errore && (
        <p className="rounded-2xl border border-brand/30 bg-brand/5 p-4 text-sm text-brand-dark">
          {t.cart.errors[errore as keyof typeof t.cart.errors] ?? t.cart.errors.generic}
        </p>
      )}
      <ul className="divide-y divide-line">
        {lines.map(({ listing, quantity }) => (
          <li key={listing.id} className="flex flex-wrap items-center gap-4 py-3">
            <Link href={`/${listing.game.slug}/p/${listing.id}`} className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted p-1">
              {thumb(listing) && <SafeImage src={thumb(listing)!} alt="" className="h-full w-full object-contain" />}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/${listing.game.slug}/p/${listing.id}`} className="font-medium hover:text-brand">
                {listing.title}
              </Link>
              <p className="text-sm text-black/50">{formatPrice(listing.priceCents)}</p>
            </div>
            <form action={setQuantity} className="flex items-center gap-2">
              <input type="hidden" name="listingId" value={listing.id} />
              <input
                type="number"
                name="quantity"
                defaultValue={quantity}
                min={0}
                max={listing.stock}
                className="w-16 rounded border border-line bg-white px-2 py-1"
              />
              <button className="text-sm underline">{t.cart.update}</button>
              <button name="quantity" value="0" className="text-sm text-black/50 underline hover:text-brand">{t.cart.remove}</button>
            </form>
            <span className="w-24 text-right font-semibold">{formatPrice(listing.priceCents * quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="text-sm text-black/60">
          <Link href="/pokemon" className="hover:text-brand">{t.cart.continue}</Link>
          <p className="mt-3 font-semibold text-black/80">{t.cart.shippingTitle}</p>
          {zoneList.map((z) => (
            <p key={z.id}>
              {z.name}: {subtotal >= (z.freeOverCents ?? Infinity) ? "0,00 €" : formatPrice(z.baseCents)}
              {z.freeOverCents ? ` (${t.cart.freeOver} ${formatPrice(z.freeOverCents)})` : ""}
            </p>
          ))}
        </div>
        <p className="text-right text-lg">
          {t.cart.subtotal}: <strong>{formatPrice(subtotal)}</strong>
        </p>
      </div>
      <form action={startCheckout} className="ml-auto max-w-sm space-y-3">
        <label className="block">
          <span className="text-sm opacity-70">{t.cart.email}</span>
          <input type="email" name="email" required className="mt-1 w-full rounded border border-line bg-white px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm opacity-70">{t.cart.country}</span>
          <select name="country" defaultValue="IT" className="mt-1 w-full rounded border border-line bg-white px-3 py-2">
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>
        <button className="w-full rounded-full bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">{t.cart.pay}</button>
        <p className="text-center text-xs text-black/50">
          {t.cart.terms1} <Link href="/termini" className="underline">{t.cart.terms2}</Link>{t.cart.terms3}
        </p>
        <p className="text-xs opacity-70">{t.cart.note}</p>
      </form>
    </div>
  );
}
