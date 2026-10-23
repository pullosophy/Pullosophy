// Importa espansioni e carte dalla Pokémon TCG API (https://pokemontcg.io).
// Uso: npm run import:pokemon -- [setId...]   (senza argomenti importa solo le espansioni)
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const API = "https://api.pokemontcg.io/v2";
const headers: Record<string, string> = process.env.POKEMONTCG_API_KEY
  ? { "X-Api-Key": process.env.POKEMONTCG_API_KEY }
  : {};

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
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

async function importSets(gameId: string) {
  const { data } = await get<ApiSet>("/sets?orderBy=releaseDate&pageSize=250");
  for (const s of data) {
    const fields = {
      name: s.name,
      series: s.series,
      releaseDate: new Date(s.releaseDate.replaceAll("/", "-")),
      logoUrl: s.images.logo,
      symbolUrl: s.images.symbol,
    };
    await db.cardSet.upsert({
      where: { gameId_externalId: { gameId, externalId: s.id } },
      update: fields,
      create: { ...fields, gameId, externalId: s.id, slug: s.id },
    });
  }
  console.log(`Espansioni: ${data.length}`);
}

async function importCards(gameId: string, externalSetId: string) {
  const set = await db.cardSet.findUniqueOrThrow({
    where: { gameId_externalId: { gameId, externalId: externalSetId } },
  });
  let page = 1;
  let imported = 0;
  for (;;) {
    const { data, totalCount } = await get<ApiCard>(
      `/cards?q=set.id:${externalSetId}&page=${page}&pageSize=250`,
    );
    for (const c of data) {
      const fields = {
        name: c.name,
        number: c.number,
        rarity: c.rarity,
        supertype: c.supertype,
        imageSmall: c.images.small,
        imageLarge: c.images.large,
      };
      await db.card.upsert({
        where: { externalId: c.id },
        update: fields,
        create: { ...fields, externalId: c.id, setId: set.id },
      });
    }
    imported += data.length;
    if (imported >= totalCount || data.length === 0) break;
    page++;
  }
  console.log(`${set.name}: ${imported} carte`);
}

async function main() {
  const game = await db.game.findUniqueOrThrow({ where: { slug: "pokemon" } });
  await importSets(game.id);
  for (const setId of process.argv.slice(2)) await importCards(game.id, setId);
}

main().finally(() => db.$disconnect());
