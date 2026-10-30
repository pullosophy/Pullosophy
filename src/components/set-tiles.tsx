import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { setName } from "@/lib/set-name";
import type { Locale } from "@/lib/i18n";

type SetTile = {
  slug: string;
  name: string;
  nameIt: string | null;
  logoUrl: string | null;
  game: { slug: string };
  _count: { listings: number };
};

// Riquadri "Sfoglia per espansione" in home: logo dell'espansione (o il nome in grande se manca),
// nome nella lingua del sito e numero di prodotti disponibili.
export function SetTiles({ sets, locale, productsLabel }: { sets: SetTile[]; locale: Locale; productsLabel: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {sets.map((s) => {
        const name = setName(s, locale);
        return (
          <Link
            key={s.slug}
            href={`/${s.game.slug}?set=${encodeURIComponent(s.slug)}`}
            className="group flex flex-col rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-foreground hover:shadow-lg"
          >
            <div className="grid h-20 place-items-center">
              {s.logoUrl ? (
                <SafeImage
                  src={s.logoUrl}
                  alt=""
                  shape="logo"
                  loading="lazy"
                  className="max-h-20 w-full object-contain transition group-hover:scale-105"
                  fallback={<span className="font-display text-center text-3xl leading-none text-foreground">{name}</span>}
                />
              ) : (
                <span className="font-display text-center text-3xl leading-none text-foreground">{name}</span>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold leading-tight">{name}</p>
            <p className="text-xs text-black/50">
              {s._count.listings} {productsLabel}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
