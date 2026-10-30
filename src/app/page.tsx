import Link from "next/link";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { TrustBar } from "@/components/trust-bar";
import { CategoryBanner } from "@/components/category-banner";
import { SetTiles } from "@/components/set-tiles";
import type { ListingKind, Prisma } from "@prisma/client";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Immagini per i banner di categoria: i pezzi piu' costosi online di quel tipo.
async function bannerImages(kind: ListingKind) {
  const listings = await db.listing.findMany({
    where: { kind, published: true },
    include: { card: true },
    orderBy: [{ stock: "desc" }, { priceCents: "desc" }],
    take: 12,
  });
  const images = listings.map((l) => l.images[0] ?? l.card?.imageLarge ?? l.card?.imageSmall).filter((u): u is string => !!u);
  // Catalogo ancora vuoto di singole: mostriamo le carte piu' quotate su Cardmarket tra quelle importate.
  if (kind === "SINGLE" && images.length < 4) {
    const cards = await db.card.findMany({
      where: { imageLarge: { not: null }, cmTrendCents: { not: null } },
      orderBy: { cmTrendCents: "desc" },
      take: 4 - images.length,
    });
    images.push(...cards.map((c) => c.imageLarge!));
  }
  return [...new Set(images)].slice(0, 4);
}

const withRelations = { card: true, set: true, game: true } satisfies Prisma.ListingInclude;

export default async function Home() {
  const { locale, t } = await getT();
  const [singleImgs, sealedImgs, gradedImgs, saleCandidates, latest, upcoming, setsWithStock] = await Promise.all([
    bannerImages("SINGLE"),
    bannerImages("SEALED"),
    bannerImages("GRADED"),
    // Offerte: Prisma non confronta due colonne, quindi filtriamo qui sotto.
    db.listing.findMany({
      where: { published: true, stock: { gt: 0 }, compareAtCents: { not: null } },
      include: withRelations,
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    db.listing.findMany({
      where: { published: true, stock: { gt: 0 } },
      include: withRelations,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // Preordini: prodotti con data di uscita futura.
    db.listing.findMany({
      where: { published: true, stock: { gt: 0 }, releaseDate: { gt: new Date() } },
      include: withRelations,
      orderBy: { releaseDate: "asc" },
      take: 8,
    }),
    // Espansioni con logo e prodotti disponibili, dalla piu' recente: riquadri "Sfoglia per espansione".
    db.cardSet.findMany({
      where: { logoUrl: { not: null }, listings: { some: { published: true, stock: { gt: 0 } } } },
      select: {
        id: true,
        slug: true,
        name: true,
        nameIt: true,
        logoUrl: true,
        releaseDate: true,
        game: { select: { slug: true } },
        _count: { select: { listings: { where: { published: true, stock: { gt: 0 } } } } },
      },
      orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
      take: 8,
    }),
  ]);
  // Solo espansioni con logo: quelle senza (o con il segnaposto TCGdex) vengono nascoste dal componente.
  const setTiles = setsWithStock.filter((s) => s.logoUrl);

  const onSale = saleCandidates.filter((l) => l.compareAtCents! > l.priceCents).slice(0, 8);
  // Ordine come Nerdtopia: singole (chiaro), gradate (nero), sigillati (rosso). I titoli in i18n sono singole, sigillati, gradate.
  const categories = [
    { href: "/pokemon?tipo=single", title: t.home.categories[0].title, images: singleImgs, variant: "light" as const },
    { href: "/pokemon?tipo=graded", title: t.home.categories[2].title, images: gradedImgs, variant: "dark" as const },
    { href: "/pokemon?tipo=sealed", title: t.home.categories[1].title, images: sealedImgs, variant: "red" as const },
  ];

  return (
    <div className="space-y-16">
      <section className="-mx-4 -mt-8 bg-brand px-4 py-14 text-white sm:rounded-b-3xl sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">{t.home.kicker}</p>
          <h1 className="font-display mt-4 text-[clamp(4rem,14vw,9rem)]">
            PULL<span className="text-foreground">OSOPHY</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/90">{t.home.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pokemon" className="rounded-full bg-foreground px-6 py-3 font-semibold hover:bg-black">
              {t.home.browse}
            </Link>
            <Link href="/pokemon?tipo=graded" className="rounded-full bg-white px-6 py-3 font-semibold text-foreground hover:bg-white/90">
              {t.home.graded}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {categories.map((c) => (
          <CategoryBanner key={c.href} kicker={t.home.bannerKicker} cta={t.home.seeAll} {...c} />
        ))}
      </section>

      {setTiles.length >= 2 && (
        <SetTiles
          sets={setTiles}
          locale={locale}
          productsLabel={t.catalog.products}
          header={
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-5xl">{t.home.bySet}</h2>
                <p className="text-black/60">{t.home.bySetText}</p>
              </div>
              <Link href="/pokemon" className="hidden text-sm font-semibold hover:text-brand sm:block">
                {t.home.bySetAll}
              </Link>
            </div>
          }
        />
      )}

      {onSale.length > 0 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-5xl">{t.home.onSale}</h2>
            <p className="text-black/60">{t.home.onSaleText}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {onSale.map((l) => (
              <ListingCard key={l.id} listing={l} t={t} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-5xl">{t.home.latest}</h2>
          <Link href="/pokemon" className="text-sm font-semibold hover:text-brand">
            {t.home.allCatalog}
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="rounded-2xl bg-muted p-8 text-center text-black/60">{t.home.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {latest.map((l) => (
              <ListingCard key={l.id} listing={l} t={t} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-5xl">{t.home.upcoming}</h2>
            <p className="text-black/60">{t.home.upcomingText}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {upcoming.map((l) => (
              <ListingCard key={l.id} listing={l} t={t} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <TrustBar t={t} />

      <section className="grid gap-6 rounded-2xl border border-line p-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{t.home.aboutKicker}</p>
          <h2 className="font-display mt-2 text-4xl">{t.home.aboutTitle}</h2>
          <p className="mt-2 max-w-2xl text-black/70">{t.home.aboutText}</p>
        </div>
        <Link href="/chi-siamo" className="rounded-full bg-foreground px-6 py-3 text-center font-semibold text-white hover:bg-brand">
          {t.home.aboutLink}
        </Link>
      </section>

      <section className="rounded-2xl bg-foreground px-8 py-12 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{t.home.soonKicker}</p>
        <h2 className="font-display mt-2 text-5xl">
          {t.home.soonTitle} <span className="text-brand">{t.home.soonTitle2}</span>
        </h2>
        <p className="mt-2 text-white/70">{t.home.soonText}</p>
      </section>
    </div>
  );
}
