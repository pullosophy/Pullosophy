import Link from "next/link";
import { db } from "@/lib/db";
import { cartLines } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { setQuantity } from "@/app/actions/cart";
import { startCheckout } from "@/app/actions/checkout";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carrello" };

const countryNames = new Intl.DisplayNames(["it"], { type: "region" });

export default async function CartPage() {
  const lines = await cartLines();
  if (lines.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-6xl">Carrello</h1>
        <p className="opacity-70">Il carrello è vuoto.</p>
        <Link href="/pokemon" className="underline">Vai al catalogo</Link>
      </div>
    );
  }

  const zones = await db.shippingZone.findMany();
  const countries = zones
    .flatMap((z) => z.countries)
    .map((code) => ({ code, name: countryNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
  const subtotal = lines.reduce((sum, l) => sum + l.listing.priceCents * l.quantity, 0);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-6xl">Carrello</h1>
      <ul className="divide-y divide-line">
        {lines.map(({ listing, quantity }) => (
          <li key={listing.id} className="flex items-center gap-4 py-3">
            <Link href={`/${listing.game.slug}/p/${listing.id}`} className="flex-1 font-medium">
              {listing.title}
            </Link>
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
              <button className="text-sm underline">Aggiorna</button>
            </form>
            <span className="w-24 text-right">{formatPrice(listing.priceCents * quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="text-right text-lg">
        Subtotale: <strong>{formatPrice(subtotal)}</strong>
      </p>
      <form action={startCheckout} className="ml-auto max-w-sm space-y-3">
        <label className="block">
          <span className="text-sm opacity-70">Email</span>
          <input type="email" name="email" required className="mt-1 w-full rounded border border-line bg-white px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm opacity-70">Paese di spedizione</span>
          <select name="country" defaultValue="IT" className="mt-1 w-full rounded border border-line bg-white px-3 py-2">
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>
        <button className="w-full rounded-full bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">Vai al pagamento</button>
        <p className="text-center text-xs text-black/50">
          Procedendo accetti i <Link href="/termini" className="underline">termini di vendita</Link>. Reso entro 14 giorni.
        </p>
        <p className="text-xs opacity-70">Le spese di spedizione sono calcolate in base al paese. Prezzi IVA inclusa.</p>
      </form>
    </div>
  );
}
