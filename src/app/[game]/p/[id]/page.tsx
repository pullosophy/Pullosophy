import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { conditionLabels, languageLabels, sealedLabels } from "@/lib/labels";
import { addToCart } from "@/app/actions/cart";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ game: string; id: string }> };

// Condiviso tra metadata e pagina: una sola query per richiesta.
const getListing = cache(async (game: string, id: string) => {
  const listing = await db.listing.findUnique({
    where: { id },
    include: { card: true, set: true, game: true },
  });
  if (!listing || !listing.published || listing.game.slug !== game) return null;
  return listing;
});

function listingImages(listing: NonNullable<Awaited<ReturnType<typeof getListing>>>) {
  return listing.images.length > 0 ? listing.images : [listing.card?.imageLarge].filter((u): u is string => !!u);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { game, id } = await params;
  const listing = await getListing(game, id);
  if (!listing) return {};
  const description = [
    listing.set?.name,
    languageLabels[listing.language] ?? listing.language,
    listing.condition && conditionLabels[listing.condition],
    listing.grader && `${listing.grader} ${listing.grade}`,
    formatPrice(listing.priceCents),
  ]
    .filter(Boolean)
    .join(" · ");
  const image = listingImages(listing)[0];
  return {
    title: listing.title,
    description: `${listing.title}: ${description}. Spedizione in tutta Europa da Pullosophy, Mantova.`,
    alternates: { canonical: `/${game}/p/${id}` },
    openGraph: { title: listing.title, description, images: image ? [image] : undefined },
  };
}

export default async function ListingPage({ params }: Params) {
  const { game, id } = await params;
  const listing = await getListing(game, id);
  if (!listing) notFound();

  const images = listingImages(listing);
  // Dati strutturati per Google (prezzo e disponibilita' nei risultati di ricerca).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    image: images,
    sku: listing.id,
    brand: { "@type": "Brand", name: listing.game.name },
    offers: {
      "@type": "Offer",
      price: (listing.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: listing.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition:
        listing.kind === "SEALED" || listing.condition === "MINT"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
    },
  };
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
    <div className="grid gap-10 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="space-y-3">
        {images.map((src) => (
          <div key={src} className="rounded-2xl bg-muted p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={listing.title} className="mx-auto max-h-[70vh] w-auto rounded-lg" />
          </div>
        ))}
      </div>
      <div className="space-y-6 md:sticky md:top-24 md:self-start">
        <div>
          <Link href={`/${game}`} className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            {listing.game.name}
          </Link>
          <h1 className="font-display mt-2 text-5xl">{listing.title}</h1>
        </div>
        <p className="text-3xl font-semibold">{formatPrice(listing.priceCents)}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-line py-4 text-sm">
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-black/50">{label}</dt>
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
              className="w-20 rounded-full border border-line px-4 py-3"
            />
            <button className="flex-1 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              Aggiungi al carrello
            </button>
          </form>
        ) : (
          <p className="rounded-full bg-muted px-6 py-3 text-center font-semibold">Esaurito</p>
        )}
      </div>
    </div>
  );
}
