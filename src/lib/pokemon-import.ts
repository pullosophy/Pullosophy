// Import di espansioni e carte dalla Pokémon TCG API (https://pokemontcg.io).
import type { PrismaClient } from "@prisma/client";

const API = "https://api.pokemontcg.io/v2";

type ApiSet = {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  images: { symbol: string; logo: string };
};
type ApiCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  supertype: string;
  images: { small: string; large: string };
  cardmarket?: {
    url: string;
    updatedAt: string; // "2026/10/25"
    prices?: { averageSellPrice?: number; lowPrice?: number; trendPrice?: number };
  };
};

const cents = (v?: number) => (typeof v === "number" && v > 0 ? Math.round(v * 100) : null);

const PAGE_SIZE = 100;

async function get<T>(path: string): Promise<{ data: T[]; totalCount: number }> {
  const headers: Record<string, string> = process.env.POKEMONTCG_API_KEY
    ? { "X-Api-Key": process.env.POKEMONTCG_API_KEY }
    : {};
  // L'API pubblica risponde spesso 5xx (soprattutto senza chiave): fino a 4 tentativi con attesa crescente.
  let last = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res.json();
      last = `${res.status}`;
      if (res.status < 500 && res.status !== 429) break;
    } catch (err) {
      last = err instanceof Error && err.name === "TimeoutError" ? "timeout" : (err as Error).message;
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  const hint = process.env.POKEMONTCG_API_KEY
    ? "il servizio pokemontcg.io è momentaneamente giù, riprova tra qualche minuto"
    : "il servizio pokemontcg.io è instabile senza chiave: aggiungi POKEMONTCG_API_KEY su Vercel (gratis) e riprova";
  throw new Error(`Pokémon TCG API non risponde (${last}): ${hint}`);
}

async function pokemonGameId(db: PrismaClient) {
  const game = await db.game.findUniqueOrThrow({ where: { slug: "pokemon" } });
  return game.id;
}

export async function importPokemonSets(db: PrismaClient) {
  const gameId = await pokemonGameId(db);
  const { data } = await get<ApiSet>("/sets?orderBy=releaseDate&pageSize=250");
  await db.$transaction(
    data.map((s) => {
      const fields = {
        name: s.name,
        series: s.series,
        releaseDate: new Date(s.releaseDate.replaceAll("/", "-")),
        logoUrl: s.images.logo,
        symbolUrl: s.images.symbol,
      };
      return db.cardSet.upsert({
        where: { gameId_externalId: { gameId, externalId: s.id } },
        update: fields,
        create: { ...fields, gameId, externalId: s.id, slug: s.id },
      });
    }),
  );
  return data.length;
}

export async function importPokemonCards(db: PrismaClient, externalSetId: string) {
  const gameId = await pokemonGameId(db);
  const set = await db.cardSet.findUniqueOrThrow({
    where: { gameId_externalId: { gameId, externalId: externalSetId } },
  });
  let page = 1;
  let imported = 0;
  for (;;) {
    const { data, totalCount } = await get<ApiCard>(
      `/cards?q=set.id:${encodeURIComponent(externalSetId)}&page=${page}&pageSize=${PAGE_SIZE}&orderBy=number`,
    );
    await db.$transaction(
      data.map((c) => {
        const fields = {
          name: c.name,
          number: c.number,
          rarity: c.rarity,
          supertype: c.supertype,
          imageSmall: c.images.small,
          imageLarge: c.images.large,
          cmTrendCents: cents(c.cardmarket?.prices?.trendPrice),
          cmAvgCents: cents(c.cardmarket?.prices?.averageSellPrice),
          cmLowCents: cents(c.cardmarket?.prices?.lowPrice),
          cmUrl: c.cardmarket?.url ?? null,
          cmUpdatedAt: c.cardmarket?.updatedAt ? new Date(c.cardmarket.updatedAt.replaceAll("/", "-")) : null,
        };
        return db.card.upsert({
          where: { externalId: c.id },
          update: fields,
          create: { ...fields, externalId: c.id, setId: set.id },
        });
      }),
    );
    imported += data.length;
    if (imported >= totalCount || data.length === 0) break;
    page++;
  }
  return { setName: set.name, imported };
}
