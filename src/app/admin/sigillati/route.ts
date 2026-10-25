import { db } from "@/lib/db";
import { sealedTemplates } from "@/lib/sealed-catalog";

// Prodotti sigillati "standard" di un'espansione per il modulo prodotto (protetto dal middleware /admin).
export async function GET(req: Request) {
  const setId = new URL(req.url).searchParams.get("setId");
  if (!setId) return Response.json([]);
  const set = await db.cardSet.findUnique({
    where: { id: setId },
    select: { name: true, series: true, releaseDate: true, logoUrl: true },
  });
  return Response.json(set ? sealedTemplates(set) : []);
}
