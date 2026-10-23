import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { conditionLabels, languageLabels, sealedLabels } from "@/lib/labels";
import { addToCart } from "@/app/actions/cart";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ game: string; id: string }> }) {
  const { game, id } = await params;
  const listing = await db.listing.findUnique({
    where: { id },
    include: { card: true, set: true, game: true },
  });
  if (!listing || !listing.published || listing.game.slug !== game) notFound();

  const images = listing.images.length > 0 ? listing.images : [listing.card?.imageLarge].filter((u): u is string => !!u);
  const details: [string, string | undefined][] = [
    ["Espansione", listing.set?.name],
    ["Numero", listing.card?.number],
    ["Rarità", listing.card?.rarity ?? undefined],
    ["Lingua", languageLabels[listing.language] ?? listing.language],
    ["Condizione", listing.condition ? conditionLabels[listing.condition] : undefined],
    ["Tipo", listing.sealedType ? sealedLabels[listing.sealedType] : undefined],
    ["Gradazione", listing.grader ? `${listing.grader} ${listing.grade}` : undefined],
    ["Certificato", listing.certNumber ?? undefined],
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">
        {images.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={listing.title} className="w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">{listing.title}</h1>
        <p className="text-2xl font-semibold">{formatPrice(listing.priceCents)}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="opacity-70">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
        {listing.stock > 0 ? (
          <form action={addToCart} className="flex gap-3 items-center">
            <input type="hidden" name="listingId" value={listing.id} />
            <input
              type="number"
              name="quantity"
              defaultValue={1}
              min={1}
              max={listing.stock}
              className="w-20 rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-2"
            />
            <button className="rounded bg-foreground text-background px-5 py-2 font-medium">Aggiungi al carrello</button>
            <span className="text-sm opacity-70">{listing.stock} disponibili</span>
          </form>
        ) : (
          <p className="font-medium">Esaurito</p>
        )}
      </div>
    </div>
  );
}
