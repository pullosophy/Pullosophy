import Link from "next/link";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { TrustBar } from "@/components/trust-bar";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { t } = await getT();
  const categories = ["/pokemon?tipo=single", "/pokemon?tipo=sealed", "/pokemon?tipo=graded"].map((href, i) => ({ href, ...t.home.categories[i] }));
  const latest = await db.listing.findMany({
    where: { published: true, stock: { gt: 0 } },
    include: { card: true, set: true, game: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

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

      <section className="grid gap-4 sm:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-line p-6 transition-colors hover:border-brand hover:bg-brand hover:text-white"
          >
            <h2 className="font-display text-4xl">{c.title}</h2>
            <p className="mt-2 text-sm text-black/60 group-hover:text-white/90">{c.text}</p>
            <span className="mt-4 inline-block text-sm font-semibold">{t.home.seeAll}</span>
          </Link>
        ))}
      </section>

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
              <ListingCard key={l.id} listing={l} t={t} />
            ))}
          </div>
        )}
      </section>

      <TrustBar t={t} />

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
