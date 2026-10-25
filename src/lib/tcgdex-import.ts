// Import di espansioni, carte e prezzi Cardmarket da TCGdex (https://tcgdex.dev): gratuita, senza chiave.
import type { PrismaClient } from "@prisma/client";

const API = process.env.TCGDEX_API ?? "https://api.tcgdex.net/v2/en";
const CONCURRENCY = 8;
const TIME_BUDGET_MS = 40_000; // l'azione admin ha 60 s: ci fermiamo prima e si riprende al clic successivo
const FRESH_MS = 12 * 60 * 60 * 1000; // carte scaricate nelle ultime 12 ore non vengono richieste di nuovo

type SetResume = { id: string; name: string; logo?: string; symbol?: string; cardCount: { total: number; official: number } };
type CardResume = { id: string; localId: string; name: string; image?: string };
type SetDetail = SetResume & { releaseDate?: string; serie?: { id: string; name: string }; cards: CardResume[] };
type CardDetail = CardResume & {
  rarity?: string;
  category?: string;
  pricing?: {
    cardmarket?: {
      updated?: string;
      avg?: number;
      low?: number;
      trend?: number;
      "avg-holo"?: number;
      "low-holo"?: number;
      "trend-holo"?: number;
    } | null;
  } | null;
};

const cents = (v?: number | null) => (typeof v === "number" && v > 0 ? Math.round(v * 100) : null);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function get<T>(path: string): Promise<T> {
  let last = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res.json();
      last = String(res.status);
      if (res.status === 404) throw new Error(`TCGdex: ${path} non trovato`);
      if (res.status < 500 && res.status !== 429) break;
    } catch (err) {
      if ((err as Error).message.startsWith("TCGdex:")) throw err;
      last = err instanceof Error && err.name === "TimeoutError" ? "timeout" : (err as Error).message;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`TCGdex non risponde (${last}): riprova tra qualche minuto`);
}

// Esegue `fn` su ogni elemento con al massimo CONCURRENCY richieste in parallelo.
async function parallel<T>(items: T[], fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

async function pokemonGameId(db: PrismaClient) {
  return (await db.game.findUniqueOrThrow({ where: { slug: "pokemon" } })).id;
}

// Lista espansioni: aggancia quelle gia' presenti (dalla vecchia API) per nome, crea le nuove.
// Poche query (una lettura, scritture solo dove cambia qualcosa) e tempo massimo: al clic successivo continua.
export async function importPokemonSets(db: PrismaClient) {
  const started = Date.now();
  const gameId = await pokemonGameId(db);
  const remote = await get<SetResume[]>("/sets");
  const existing = await db.cardSet.findMany({
    where: { gameId },
    select: { id: true, name: true, slug: true, externalId: true, tcgdexId: true, logoUrl: true, symbolUrl: true },
  });
  const byTcgdex = new Map(existing.filter((s) => s.tcgdexId).map((s) => [s.tcgdexId!, s]));
  const unlinked = existing.filter((s) => !s.tcgdexId);
  const byName = new Map(unlinked.map((s) => [norm(s.name), s]));
  // Stesso codice nelle due fonti (es. "sv10", "me01"): e' la stessa espansione anche se il nome e' scritto diversamente.
  const byCode = new Map<string, (typeof existing)[number]>();
  for (const s of unlinked) {
    if (s.externalId) byCode.set(s.externalId.toLowerCase(), s);
    byCode.set(s.slug.toLowerCase(), s);
  }
  const slugs = new Set(existing.map((s) => s.slug.toLowerCase()));
  const used = new Set(byTcgdex.keys());
  const tcgdexAssets = (r: SetResume) => ({
    logoUrl: r.logo ? `${r.logo}.png` : null,
    symbolUrl: r.symbol ? `${r.symbol}.png` : null,
  });

  const updates: { id: string; data: { tcgdexId?: string; logoUrl?: string | null; symbolUrl?: string | null } }[] = [];
  const toCreate: SetResume[] = [];
  let linked = 0;
  for (const r of remote) {
    const assets = tcgdexAssets(r);
    // Loghi e simboli TCGdex solo dove mancano: quelli gia' presenti (vecchia API) restano, perche' su TCGdex non tutti esistono.
    const known = byTcgdex.get(r.id);
    if (known) {
      const data = {
        ...(known.logoUrl || !assets.logoUrl ? {} : { logoUrl: assets.logoUrl }),
        ...(known.symbolUrl || !assets.symbolUrl ? {} : { symbolUrl: assets.symbolUrl }),
      };
      if (Object.keys(data).length) updates.push({ id: known.id, data });
      continue;
    }
    // Nome uguale, oppure un nome contenuto nell'altro (es. "Mega Evolution 30th Celebration" / "30th Celebration").
    const rn = norm(r.name);
    let match = byName.get(rn);
    if (!match) {
      const code = byCode.get(r.id.toLowerCase());
      if (code && byName.has(norm(code.name))) match = code; // non ancora collegata in questo giro
    }
    if (!match && rn.length >= 5) {
      const fuzzy = [...byName.entries()].filter(([n]) => n.length >= 5 && (n.includes(rn) || rn.includes(n)));
      if (fuzzy.length === 1) match = fuzzy[0][1];
    }
    if (match && !used.has(r.id)) {
      updates.push({
        id: match.id,
        data: { tcgdexId: r.id, logoUrl: match.logoUrl ?? assets.logoUrl, symbolUrl: match.symbolUrl ?? assets.symbolUrl },
      });
      byName.delete(norm(match.name));
      used.add(r.id);
      linked++;
      continue;
    }
    toCreate.push(r);
  }

  // Tutti gli aggiornamenti in una transazione sola (un viaggio al database invece di centinaia).
  if (updates.length) await db.$transaction(updates.map((u) => db.cardSet.update({ where: { id: u.id }, data: u.data })));

  // Le nuove hanno bisogno del dettaglio per data di uscita e serie: in parallelo, entro il tempo massimo.
  let created = 0;
  let stopped = false;
  await parallel(toCreate, async (r) => {
    if (stopped || Date.now() - started > TIME_BUDGET_MS) {
      stopped = true;
      return;
    }
    const d = await get<SetDetail>(`/sets/${encodeURIComponent(r.id)}`).catch(() => null);
    await db.cardSet.create({
      data: {
        gameId,
        tcgdexId: r.id,
        slug: slugs.has(r.id.toLowerCase()) ? `tcgdex-${r.id}` : r.id,
        name: r.name,
        series: d?.serie?.name ?? null,
        releaseDate: d?.releaseDate ? new Date(d.releaseDate) : null,
        ...tcgdexAssets(r),
      },
    });
    created++;
  });
  return { total: remote.length, created, linked, partial: stopped, remaining: toCreate.length - created };
}

// Carte di un'espansione con prezzi Cardmarket. Si ferma entro il tempo massimo e riprende al clic successivo.
export async function importPokemonCards(db: PrismaClient, setId: string) {
  const started = Date.now();
  const set = await db.cardSet.findUniqueOrThrow({ where: { id: setId } });
  if (!set.tcgdexId) {
    throw new Error(`"${set.name}" non è collegata a TCGdex: premi "Aggiorna elenco espansioni" e riprova`);
  }
  const detail = await get<SetDetail>(`/sets/${encodeURIComponent(set.tcgdexId)}`);
  await db.cardSet.update({
    where: { id: set.id },
    data: {
      series: set.series ?? detail.serie?.name ?? null,
      releaseDate: set.releaseDate ?? (detail.releaseDate ? new Date(detail.releaseDate) : null),
      logoUrl: set.logoUrl ?? (detail.logo ? `${detail.logo}.png` : null),
      symbolUrl: set.symbolUrl ?? (detail.symbol ? `${detail.symbol}.png` : null),
    },
  });

  const fresh = await db.card.findMany({
    where: { setId: set.id, syncedAt: { gt: new Date(Date.now() - FRESH_MS) } },
    select: { number: true },
  });
  const skip = new Set(fresh.map((c) => c.number));
  const todo = detail.cards.filter((c) => !skip.has(c.localId));
  let imported = 0;
  let stopped = false;

  await parallel(todo, async (c) => {
    if (stopped || Date.now() - started > TIME_BUDGET_MS) {
      stopped = true;
      return;
    }
    const card = await get<CardDetail>(`/cards/${encodeURIComponent(c.id)}`);
    const cm = card.pricing?.cardmarket ?? null;
    const image = card.image ?? c.image;
    const fields = {
      name: card.name,
      rarity: card.rarity ?? null,
      supertype: card.category ?? null,
      ...(image ? { imageSmall: `${image}/low.webp`, imageLarge: `${image}/high.webp` } : {}),
      cmTrendCents: cents(cm?.trend ?? cm?.["trend-holo"]),
      cmAvgCents: cents(cm?.avg ?? cm?.["avg-holo"]),
      cmLowCents: cents(cm?.low ?? cm?.["low-holo"]),
      cmUpdatedAt: cm?.updated ? new Date(cm.updated) : null,
      syncedAt: new Date(),
    };
    const cmUrl = `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(`${card.name} ${c.localId}`)}`;
    await db.card.upsert({
      where: { setId_number: { setId: set.id, number: c.localId } },
      update: { ...fields, cmUrl: fields.cmTrendCents ? cmUrl : undefined },
      create: { ...fields, cmUrl, externalId: c.id, setId: set.id, number: c.localId },
    });
    imported++;
  });

  return { setName: set.name, imported, skipped: skip.size, total: detail.cards.length, partial: stopped };
}
