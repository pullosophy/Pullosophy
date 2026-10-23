import { notFound } from "next/navigation";
import type { ListingKind } from "@prisma/client";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const kinds: Record<string, ListingKind> = { single: "SINGLE", sealed: "SEALED", graded: "GRADED" };

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
      kind: tipo ? kinds[tipo] : undefined,
      set: set ? { slug: set } : undefined,
      title: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    include: { card: true, set: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{game.name}</h1>
      {listings.length === 0 ? (
        <p className="opacity-70">Nessun prodotto disponibile per ora.</p>
      ) : (
        <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <li key={l.id} className="rounded-lg border border-black/10 dark:border-white/15 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.images[0] ?? l.card?.imageSmall ?? ""} alt={l.title} className="w-full aspect-[63/88] object-contain" />
              <p className="mt-2 font-medium">{l.title}</p>
              <p className="text-sm opacity-70">
                {l.set?.name} · {l.language.toUpperCase()}
                {l.grader && ` · ${l.grader} ${l.grade}`}
              </p>
              <p className="mt-1 font-semibold">{formatPrice(l.priceCents)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
