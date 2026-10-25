import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { conditionLabels } from "@/lib/labels";
import { getT, type Dictionary } from "@/lib/i18n";
import { addToCart } from "@/app/actions/cart";
import { RestockForm } from "@/components/restock-form";
import { SafeImage } from "@/components/safe-image";
import { ListingCard } from "@/components/listing-card";
import { whatsappUrl } from "@/lib/company";

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
  if (listing.images.length > 0) return listing.images;
  const fallback = listing.kind === "SEALED" ? listing.set?.logoUrl : listing.card?.imageLarge;
  return fallback ? [fallback] : [];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const [{ game, id }, { t }] = await Promise.all([params, getT()]);
  const listing = await getListing(game, id);
  if (!listing) return {};
  const description = [
    listing.set?.name,
    lang(t, listing.language),
    listing.condition && conditionLabels[listing.condition],
    listing.grader && `${listing.grader} ${listing.grade}`,
    formatPrice(listing.priceCents),
  ]
    .filter(Boolean)
    .join(" · ");
  const image = listingImages(listing)[0];
  return {
    title: listing.title,
    description: `${listing.title}: ${description}. ${t.product.metaSuffix}`,
    alternates: { canonical: `/${game}/p/${id}` },
    openGraph: { title: listing.title, description, images: image ? [image] : undefined },
  };
}

const lang = (t: Dictionary, code: string) => t.languages[code as keyof typeof t.languages] ?? code;

export default async function ListingPage({ params }: Params) {
  const [{ game, id }, { locale, t }] = await Promise.all([params, getT()]);
  const listing = await getListing(game, id);
  if (!listing) notFound();

  // Altri prodotti della stessa espansione (o dello stesso gioco), in vendita.
  const related = await db.listing.findMany({
    where: { id: { not: listing.id }, gameId: listing.gameId, published: true, stock: { gt: 0 }, ...(listing.setId ? { setId: listing.setId } : {}) },
    include: { card: true, set: true, game: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  const stockLine =
    listing.stock <= 0 ? null : listing.stock === 1 ? t.product.lastOne : listing.stock <= 3 ? t.product.fewLeft.replace("{n}", String(listing.stock)) : t.product.inStock;
  const wa = whatsappUrl(`${t.product.question} ${listing.title}`);

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
    [t.product.set, listing.set?.name],
    [t.product.number, listing.card?.number],
    [t.product.rarity, listing.card?.rarity ?? undefined],
    [t.product.language, lang(t, listing.language)],
    [t.product.condition, listing.condition ? conditionLabels[listing.condition] : undefined],
    [t.product.type, listing.sealedType ? t.sealed[listing.sealedType] : undefined],
    [t.product.grading, listing.grader ? `${listing.grader} ${listing.grade}` : undefined],
    [t.product.cert, listing.certNumber ?? undefined],
  ];

  // Link per verificare il certificato sul sito dell'ente di grading.
  const certUrl =
    listing.certNumber && listing.grader === "PSA"
      ? `https://www.psacard.com/cert/${encodeURIComponent(listing.certNumber)}`
      : listing.certNumber && listing.grader === "CGC"
        ? `https://www.cgccards.com/certlookup/${encodeURIComponent(listing.certNumber)}`
        : listing.certNumber && listing.grader === "BGS"
          ? `https://www.beckett.com/grading/card-lookup?item_number=${encodeURIComponent(listing.certNumber)}`
          : null;

  return (
    <div className="space-y-12">
    <div className="grid gap-10 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="space-y-3">
        <Link href={`/${game}`} className="inline-block text-sm text-black/60 hover:text-brand md:hidden">← {t.product.back}</Link>
        {images.map((src) => (
          <div key={src} className="rounded-2xl bg-muted p-6">
            <SafeImage
              src={src}
              alt={listing.title}
              className="mx-auto max-h-[70vh] w-auto rounded-lg"
              fallback={<p className="py-16 text-center font-display text-4xl text-black/10">PULLOSOPHY</p>}
            />
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
        {listing.grader && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted p-4 text-sm">
            <span className="rounded-md bg-brand px-3 py-1 font-display text-2xl text-white">
              {listing.grader} {String(listing.grade)}
            </span>
            <div>
              <p className="font-semibold">{t.product.gradedTitle}</p>
              {certUrl ? (
                <a href={certUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  {t.product.verifyCert} {listing.certNumber} {t.product.on} {listing.grader}
                </a>
              ) : (
                <p className="text-black/60">{t.product.gradedText}</p>
              )}
            </div>
          </div>
        )}
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
        {listing.releaseDate && listing.releaseDate.getTime() > Date.now() && (
          <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm">
            <strong className="text-brand">{t.product.preorder}</strong> · {t.product.shipsFrom}{" "}
            {listing.releaseDate.toLocaleDateString(locale === "en" ? "en-GB" : "it-IT", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        {stockLine && (
          <p className={`text-sm font-medium ${listing.stock <= 3 ? "text-brand" : "text-green-700"}`}>● {stockLine}</p>
        )}
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
              {t.product.addToCart}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="rounded-full bg-muted px-6 py-3 text-center font-semibold">{t.product.soldOut}</p>
            <RestockForm listingId={listing.id} labels={t.product.restock} />
          </div>
        )}
        <ul className="space-y-1 text-sm text-black/70">
          {t.product.reassurance.map((r) => (
            <li key={r} className="flex items-center gap-2">
              <span className="text-brand">✓</span> {r}
            </li>
          ))}
        </ul>
        {listing.description && (
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{t.product.description}</p>
            <p className="whitespace-pre-line text-black/70">{listing.description}</p>
          </div>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="block text-sm underline hover:text-brand">
            {t.product.question} {t.footer.whatsapp}
          </a>
        )}
        <Link href={`/${game}`} className="hidden text-sm text-black/60 hover:text-brand md:block">← {t.product.back}</Link>
      </div>
    </div>
    {related.length > 0 && (
      <section className="space-y-4 border-t border-line pt-8">
        <h2 className="font-display text-3xl">
          {t.product.related} {listing.set?.name ?? listing.game.name}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {related.map((l) => (
            <ListingCard key={l.id} listing={l} t={t} />
          ))}
        </div>
      </section>
    )}
    </div>
  );
}
