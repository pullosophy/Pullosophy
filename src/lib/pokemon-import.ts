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
};

async function get<T>(path: string): Promise<{ data: T[]; totalCount: number }> {
  const headers: Record<string, string> = process.env.POKEMONTCG_API_KEY
    ? { "X-Api-Key": process.env.POKEMONTCG_API_KEY }
    : {};
  // L'API pubblica risponde spesso 5xx senza chiave: qualche tentativo con attesa crescente.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}${path}`, { headers, cache: "no-store" });
    if (res.ok) return res.json();
    if (res.status < 500 || attempt === 3) throw new Error(`Pokémon TCG API: ${res.status} ${path}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
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
      `/cards?q=set.id:${encodeURIComponent(externalSetId)}&page=${page}&pageSize=250`,
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
