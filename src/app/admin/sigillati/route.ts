import { db } from "@/lib/db";
import { sealedTemplates } from "@/lib/sealed-catalog";

// Prodotti sigillati "standard" di un'espansione per il modulo prodotto (protetto dal middleware /admin).
export async function GET(req: Request) {
  const setId = new URL(req.url).searchParams.get("setId");
  if (!setId) return Response.json([]);
  const [set, existing] = await Promise.all([
    db.cardSet.findUnique({ where: { id: setId }, select: { name: true, series: true, releaseDate: true, logoUrl: true } }),
    db.listing.findMany({
      where: { setId, kind: "SEALED", sealedType: { not: null } },
      select: { sealedType: true, title: true, images: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const withType = existing.flatMap((e) => (e.sealedType ? [{ ...e, sealedType: e.sealedType }] : []));
  return Response.json(set ? sealedTemplates(set, withType) : []);
}
