import { ListingForm } from "../listing-form";
import { formOptions } from "../form-data";

export default async function NewListingPage() {
  const { games, sets } = await formOptions();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Nuovo prodotto</h1>
      <ListingForm
        games={games}
        sets={sets}
        initial={{
          kind: "SINGLE",
          gameId: games.find((g) => g.name === "Pokémon")?.id ?? games[0]?.id ?? "",
          setId: "",
          cardId: "",
          title: "",
          description: "",
          language: "it",
          condition: "NEAR_MINT",
          sealedType: "",
          grader: "PSA",
          grade: "",
          certNumber: "",
          price: "",
          compareAt: "",
          stock: "1",
          images: "",
          published: true,
          releaseDate: "",
        }}
      />
    </div>
  );
}
