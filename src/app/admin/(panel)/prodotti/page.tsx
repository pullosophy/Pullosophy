import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

const kindLabels = { SINGLE: "Singola", SEALED: "Sigillato", GRADED: "Gradata" } as const;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const listings = await db.listing.findMany({
    include: { set: true, game: true, _count: { select: { stockAlerts: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Prodotti</h1>
        <Link href="/admin/prodotti/nuovo" className="rounded bg-foreground text-background px-4 py-2 text-sm font-medium">
          + Nuovo prodotto
        </Link>
      </div>
      {ok && (
        <p className={`rounded px-3 py-2 text-sm ${ok.includes("NON") ? "bg-red-600/15" : "bg-green-600/15"}`}>{ok}</p>
      )}
      <p className="text-sm opacity-70">
        Sui prodotti esauriti i clienti possono chiedere “Avvisami quando torna disponibile”: quando rimetti lo stock sopra zero e salvi, ricevono una email automatica.
      </p>
      {listings.length === 0 ? (
        <p className="opacity-70">Nessun prodotto ancora.</p>
      ) : (
        <ul className="divide-y divide-black/10">
          {listings.map((l) => (
            <li key={l.id}>
              <Link href={`/admin/prodotti/${l.id}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{l.title}</p>
                  <p className="text-xs opacity-60">
                    {kindLabels[l.kind]} · {l.game.name}
                    {l.set && ` · ${l.set.name}`} · {l.language.toUpperCase()}
                  </p>
                </div>
                <span className="text-sm">
                  {l.stock} pz
                  {l._count.stockAlerts > 0 && (
                    <span className="ml-2 rounded bg-brand/15 px-2 py-0.5 text-xs text-brand" title="Clienti in attesa dell'avviso">
                      {l._count.stockAlerts} in attesa
                    </span>
                  )}
                </span>
                <span className="w-20 text-right text-sm">{formatPrice(l.priceCents)}</span>
                <span className={`text-xs rounded px-2 py-0.5 ${l.published ? "bg-green-600/15" : "bg-black/10"}`}>
                  {l.published ? "Online" : "Bozza"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
