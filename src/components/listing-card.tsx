import Link from "next/link";
import type { Card, CardSet, Game, Listing } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { conditionLabels } from "@/lib/labels";
import type { Dictionary } from "@/lib/i18n";

type Props = { listing: Listing & { card: Card | null; set: CardSet | null; game: Game }; t: Dictionary };

export function ListingCard({ listing: l, t }: Props) {
  const image = l.images[0] ?? l.card?.imageLarge ?? l.card?.imageSmall;
  const badge =
    l.kind === "GRADED"
      ? `${l.grader} ${l.grade}`
      : l.kind === "SEALED"
        ? (l.sealedType && t.sealed[l.sealedType]) || t.product.sealed
        : l.condition && conditionLabels[l.condition];

  return (
    <Link href={`/${l.game.slug}/p/${l.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
        {!image && (
          <span className="absolute inset-0 grid place-items-center font-display text-3xl text-black/10">
            PULLOSOPHY
          </span>
        )}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={l.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
        {badge && (
          <span
            className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${
              l.kind === "GRADED" ? "bg-brand text-white" : "bg-foreground text-white"
            }`}
          >
            {badge}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase">
          {l.language}
        </span>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-brand">{l.title}</p>
        {l.set && <p className="text-xs text-black/50">{l.set.name}</p>}
        <p className="font-semibold">{formatPrice(l.priceCents)}</p>
      </div>
    </Link>
  );
}
