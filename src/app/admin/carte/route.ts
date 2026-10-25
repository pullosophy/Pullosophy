import { db } from "@/lib/db";

// Carte di un'espansione per il modulo prodotto (protetto dal middleware /admin).
export async function GET(req: Request) {
  const setId = new URL(req.url).searchParams.get("setId");
  if (!setId) return Response.json([]);
  const cards = await db.card.findMany({
    where: { setId },
    select: {
      id: true,
      name: true,
      number: true,
      rarity: true,
      imageSmall: true,
      cmTrendCents: true,
      cmAvgCents: true,
      cmLowCents: true,
      cmUrl: true,
      cmUpdatedAt: true,
    },
  });
  cards.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  return Response.json(cards);
}
