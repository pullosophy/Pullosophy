// Catalogo "pronto" dei prodotti sigillati di un'espansione.
// Le API delle carte non elencano i sigillati, quindi generiamo i formati standard
// (busta, booster box, ETB, ...) a partire dall'espansione: l'admin sceglie dalla lista
// e il titolo viene compilato da solo, restando modificabile.
import type { SealedType } from "@prisma/client";

export type SealedTemplate = {
  key: string;
  sealedType: SealedType;
  label: string; // voce nel menu admin
  title: string; // titolo proposto per il negozio
  image: string | null; // logo espansione come anteprima/segnaposto
  images: string[]; // foto già caricate su un prodotto uguale (riusabili)
};

type SetInfo = { name: string; series: string | null; releaseDate: Date | null; logoUrl: string | null };

type Existing = { sealedType: SealedType; title: string; images: string[] };

export function sealedTemplates(set: SetInfo, existing: Existing[] = []): SealedTemplate[] {
  // Data sconosciuta (espansione inserita a mano): proponiamo tutti i formati.
  const year = set.releaseDate?.getFullYear() ?? 9999;
  const modern = year >= 2017; // Sole e Luna in poi: formati attuali
  const sv = year >= 2023 || /scarlet/i.test(set.series ?? ""); // Booster Bundle solo da Scarlatto e Violetto
  const items: Array<[string, SealedType, string]> = [
    ["pack", "BOOSTER_PACK", "Busta"],
    ["box", "BOOSTER_BOX", "Booster Box (36 buste)"],
    ["etb", "ELITE_TRAINER_BOX", "Elite Trainer Box"],
    ...(sv ? [["bundle", "BUNDLE", "Booster Bundle (6 buste)"] as [string, SealedType, string]] : []),
    ...(modern ? [["bb", "BUILD_BATTLE", "Build & Battle Box"] as [string, SealedType, string]] : []),
    ["blister3", "BLISTER", "Blister 3 buste"],
    ["blister1", "BLISTER", "Blister 1 busta"],
    ["display-blister", "BLISTER", "Box 24 blister"],
    ["mini-tin", "TIN", "Mini Tin"],
    ["collection", "COLLECTION_BOX", "Collezione speciale"],
    ["other", "OTHER", "Altro (scrivo io il titolo)"],
  ];
  return items.map(([key, sealedType, label]) => {
    const base = label.replace(/ \(.*\)$/, "");
    const title = key === "other" ? "" : `${base} ${set.name}`;
    // Foto di un prodotto uguale già in catalogo: stesso titolo proposto, altrimenti stesso tipo.
    const match =
      existing.find((e) => e.images.length > 0 && e.title.toLowerCase().startsWith(base.toLowerCase()) && e.sealedType === sealedType) ??
      existing.find((e) => e.images.length > 0 && e.sealedType === sealedType && key !== "other");
    return { key, sealedType, label, title, image: set.logoUrl, images: match?.images ?? [] };
  });
}
