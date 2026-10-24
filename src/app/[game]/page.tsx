import Link from "next/link";
import { notFound } from "next/navigation";
import type { ListingKind } from "@prisma/client";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";

export const dynamic = "force-dynamic";

const kinds: Record<string, { kind: ListingKind; label: string }> = {
  single: { kind: "SINGLE", label: "Singole" },
  sealed: { kind: "SEALED", label: "Sigillati" },
  graded: { kind: "GRADED", label: "Gradate" },
};

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ tipo?: string; set?: string; q?: string }>;
}) {
  const { game: slug } = await params;
  const { tipo, set, q } = await searchParams;

  const game = await db.game.findUnique({ where: { slug } });
  if (!game || !game.active) notFound();

  const listings = await db.listing.findMany({
    where: {
      gameId: game.id,
      published: true,
      stock: { gt: 0 },
      kind: tipo ? kinds[tipo]?.kind : undefined,
      set: set ? { slug: set } : undefined,
      title: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    include: { card: true, set: true, game: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium border ${
      active ? "bg-foreground text-white border-foreground" : "border-line hover:border-foreground"
    }`;
  const href = (t?: string) => {
    const p = new URLSearchParams();
    if (t) p.set("tipo", t);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/${game.slug}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Catalogo</p>
        <h1 className="font-display text-6xl">
          {game.name}
          {tipo && kinds[tipo] && <span className="text-black/30"> · {kinds[tipo].label}</span>}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={href()} className={pill(!tipo)}>Tutto</Link>
        {Object.entries(kinds).map(([key, k]) => (
          <Link key={key} href={href(key)} className={pill(tipo === key)}>
            {k.label}
          </Link>
        ))}
        <form className="ml-auto w-full sm:w-64" action={`/${game.slug}`}>
          {tipo && <input type="hidden" name="tipo" value={tipo} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Cerca una carta…"
            className="w-full rounded-full border border-line bg-muted px-4 py-2 text-sm outline-none focus:border-foreground"
          />
        </form>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-2xl bg-muted p-10 text-center text-black/60">
          Nessun prodotto {q ? `per “${q}”` : "disponibile per ora"}.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
