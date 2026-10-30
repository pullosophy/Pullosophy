import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { setName } from "@/lib/set-name";
import type { Locale } from "@/lib/i18n";

type SetTile = {
  slug: string;
  name: string;
  nameIt: string | null;
  logoUrl: string | null;
  cover: string | null;
  game: { slug: string };
  _count: { listings: number };
};

// Riquadri "Sfoglia per espansione" in home: tutti uguali, con l'illustrazione di una carta dell'espansione
// come sfondo, il logo sopra (se c'e') e nome + numero di prodotti in basso. Cosi' nessun riquadro resta vuoto.
export function SetTiles({ sets, locale, productsLabel }: { sets: SetTile[]; locale: Locale; productsLabel: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {sets.map((s) => {
        const name = setName(s, locale);
        return (
          <Link
            key={s.slug}
            href={`/${s.game.slug}?set=${encodeURIComponent(s.slug)}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-foreground text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {s.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.cover}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-[50%_15%] transition duration-300 group-hover:scale-105"
              />
            )}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            {s.logoUrl && (
              <div className="absolute inset-x-4 top-4 grid h-[45%] place-items-center">
                <SafeImage src={s.logoUrl} alt="" shape="logo" loading="lazy" className="max-h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
              </div>
            )}
            <div className="absolute inset-x-4 bottom-4">
              <p className="font-display text-2xl leading-none drop-shadow">{name}</p>
              <p className="mt-1 text-xs text-white/80">
                {s._count.listings} {productsLabel}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
