// Compito notturno (Vercel Cron, vedi vercel.json): aggiorna l'elenco espansioni e i prezzi Cardmarket
// delle carte, dando precedenza alle espansioni con prodotti in vendita e a quelle ferme da piu' tempo.
// Lavora al massimo ~50 secondi (limite Vercel Hobby: 60) e riprende la notte dopo da dove era arrivato.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importPokemonCards, importPokemonSets, isPocketSet } from "@/lib/tcgdex-import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TOTAL_MS = 50_000;
const SETS_MS = 20_000;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET non impostato su Vercel" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "non autorizzato" }, { status: 401 });

  const started = Date.now();
  const log: Record<string, unknown> = {};
  try {
    log.sets = await importPokemonSets(db, { deadline: started + SETS_MS });
  } catch (err) {
    log.sets = { error: (err as Error).message };
  }

  // Ordine: prima chi ha prodotti pubblicati, poi chi ha carte piu' vecchie. Mai le espansioni ancora vuote
  // (quelle si importano dall'admin, con "Aggiorna tutte le carte").
  const all = await db.cardSet.findMany({
    where: { game: { slug: "pokemon" }, tcgdexId: { not: null }, cards: { some: {} } },
    select: {
      id: true,
      name: true,
      tcgdexId: true,
      series: true,
      _count: { select: { listings: { where: { published: true } } } },
      cards: { select: { syncedAt: true }, orderBy: { syncedAt: "asc" }, take: 1 },
    },
  });
  const sets = all.filter((s) => !isPocketSet(s));
  const oldest = (s: (typeof sets)[number]) => s.cards[0]?.syncedAt?.getTime() ?? 0;
  sets.sort((a, b) => (b._count.listings > 0 ? 1 : 0) - (a._count.listings > 0 ? 1 : 0) || oldest(a) - oldest(b));

  const cards: { set: string; done: number; total: number; partial?: boolean; error?: string }[] = [];
  for (const s of sets) {
    if (Date.now() > started + TOTAL_MS) break;
    try {
      const r = await importPokemonCards(db, s.id, { deadline: started + TOTAL_MS });
      cards.push({ set: s.name, done: r.imported + r.skipped, total: r.total, partial: r.partial || undefined });
      if (r.partial) break;
    } catch (err) {
      cards.push({ set: s.name, done: 0, total: 0, error: (err as Error).message });
    }
  }
  log.cards = cards;
  log.ms = Date.now() - started;
  console.log("cron tcgdex", JSON.stringify(log));
  return NextResponse.json(log);
}
