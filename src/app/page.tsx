import Link from "next/link";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { TrustBar } from "@/components/trust-bar";

export const dynamic = "force-dynamic";

const categories = [
  { href: "/pokemon?tipo=single", title: "Carte singole", text: "Ogni carta con lingua e condizione indicate, controllata a mano." },
  { href: "/pokemon?tipo=sealed", title: "Sigillati", text: "Booster box, buste, Elite Trainer Box e collezioni." },
  { href: "/pokemon?tipo=graded", title: "Gradate", text: "PSA, BGS e CGC, con le foto reali di ogni slab." },
];

export default async function Home() {
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Carte collezionabili · Mantova</p>
          <h1 className="font-display mt-4 text-[clamp(4rem,14vw,9rem)]">
            PULL<span className="text-foreground">OSOPHY</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/90">Aprire un&apos;altra busta è una scelta di vita.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pokemon" className="rounded-full bg-foreground px-6 py-3 font-semibold hover:bg-black">
              Scopri il catalogo
            </Link>
            <Link href="/pokemon?tipo=graded" className="rounded-full bg-white px-6 py-3 font-semibold text-foreground hover:bg-white/90">
              Carte gradate
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
            <span className="mt-4 inline-block text-sm font-semibold">Vedi tutto →</span>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-5xl">Ultimi arrivi</h2>
          <Link href="/pokemon" className="text-sm font-semibold hover:text-brand">
            Tutto il catalogo →
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="rounded-2xl bg-muted p-8 text-center text-black/60">Le prime carte stanno arrivando. Torna presto!</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {latest.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <TrustBar />

      <section className="rounded-2xl bg-foreground px-8 py-12 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">In arrivo</p>
        <h2 className="font-display mt-2 text-5xl">
          One Piece <span className="text-brand">e altri giochi</span>
        </h2>
        <p className="mt-2 text-white/70">Il catalogo si allarga presto. Pokémon è solo l&apos;inizio.</p>
      </section>
    </div>
  );
}
