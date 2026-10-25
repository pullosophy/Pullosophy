import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ListingForm } from "../listing-form";
import { formOptions } from "../form-data";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, { games, sets }] = await Promise.all([db.listing.findUnique({ where: { id } }), formOptions()]);
  if (!listing) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Modifica prodotto</h1>
      <ListingForm
        games={games}
        sets={sets}
        initial={{
          id: listing.id,
          kind: listing.kind,
          gameId: listing.gameId,
          setId: listing.setId ?? "",
          cardId: listing.cardId ?? "",
          title: listing.title,
          description: listing.description ?? "",
          language: listing.language,
          condition: listing.condition ?? "",
          sealedType: listing.sealedType ?? "",
          grader: listing.grader ?? "",
          grade: listing.grade?.toString() ?? "",
          certNumber: listing.certNumber ?? "",
          price: (listing.priceCents / 100).toFixed(2),
          stock: String(listing.stock),
          images: listing.images.join("\n"),
          published: listing.published,
          releaseDate: listing.releaseDate?.toISOString().slice(0, 10) ?? "",
        }}
      />
    </div>
  );
}
