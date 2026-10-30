import Link from "next/link";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { socials } from "@/lib/company";

type StripCard = { id: string; name: string; image: string; href: string };

const MAX = 16;

// Carte da mostrare nella striscia: prima i prodotti in vendita (con link alla scheda),
// poi le carte con il prezzo Cardmarket piu' alto, cosi' la striscia e' piena anche con pochi prodotti.
// Cache di un'ora: la query non pesa su ogni pagina.
const getStripCards = unstable_cache(
  async (): Promise<StripCard[]> => {
    try {
      const listings = await db.listing.findMany({
        where: { published: true, kind: { in: ["SINGLE", "GRADED"] }, card: { imageSmall: { not: null } } },
        select: { id: true, game: { select: { slug: true } }, card: { select: { id: true, name: true, imageSmall: true } } },
        orderBy: { priceCents: "desc" },
        take: MAX,
      });
      const out: StripCard[] = [];
      const seen = new Set<string>();
      for (const l of listings) {
        if (!l.card?.imageSmall || seen.has(l.card.id)) continue;
        seen.add(l.card.id);
        out.push({ id: l.card.id, name: l.card.name, image: l.card.imageSmall, href: `/${l.game.slug}/p/${l.id}` });
      }
      if (out.length < MAX) {
        const top = await db.card.findMany({
          where: { imageSmall: { not: null }, cmTrendCents: { not: null }, id: { notIn: [...seen] } },
          select: { id: true, name: true, imageSmall: true, set: { select: { game: { select: { slug: true } } } } },
          orderBy: { cmTrendCents: "desc" },
          take: MAX - out.length,
        });
        for (const c of top)
          out.push({ id: c.id, name: c.name, image: c.imageSmall!, href: `/${c.set.game.slug}?q=${encodeURIComponent(c.name)}` });
      }
      return out;
    } catch {
      return [];
    }
  },
  ["top-strip-cards"],
  { revalidate: 3600 },
);

// Striscia nera in cima al sito: social a sinistra, fila di carte che scorre a destra.
export async function TopStrip({ text }: { text: string }) {
  const cards = await getStripCards();
  return (
    <div className="relative flex h-11 items-center overflow-hidden bg-foreground text-white">
      <div className="relative z-10 flex h-full shrink-0 items-center gap-3 bg-foreground pl-4 pr-3">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.name} ${s.handle}`}
            className="hover:text-brand"
          >
            <SocialIcon name={s.name} size={20} />
          </a>
        ))}
        <span className="ml-2 hidden whitespace-nowrap text-xs text-white/80 md:inline">{text}</span>
      </div>
      {cards.length > 0 && (
        <div className="top-strip relative h-full min-w-0 flex-1 overflow-hidden">
          {/* sfumatura che fa "uscire" le carte dal nero */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-foreground to-transparent" />
          <div className="top-strip-track flex h-full w-max">
            {/* lista ripetuta due volte per lo scorrimento continuo */}
            {[0, 1].map((copy) =>
              cards.map((c) => (
                <Link
                  key={`${copy}-${c.id}`}
                  href={c.href}
                  title={c.name}
                  aria-hidden={copy === 1 ? true : undefined}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="relative block h-full w-14 shrink-0 overflow-hidden border-r-2 border-brand/70 hover:brightness-110"
                >
                  {/* mostra solo la parte alta della carta (l'illustrazione) */}
                  <img
                    src={c.image}
                    alt={copy === 0 ? c.name : ""}
                    loading="lazy"
                    className="absolute left-1/2 top-0 w-[150%] max-w-none -translate-x-1/2 -translate-y-[14%]"
                  />
                </Link>
              )),
            )}
          </div>
        </div>
      )}
      {cards.length === 0 && (
        <span className="ml-auto pr-4 text-xs text-white/80 md:hidden">{text}</span>
      )}
    </div>
  );
}

export function SocialIcon({ name, size = 16 }: { name: string; size?: number }) {
  if (name === "TikTok")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.5 3c.4 2.3 1.9 3.9 4.2 4.1v3.1c-1.6 0-3-.5-4.2-1.3v6.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.2a2.6 2.6 0 1 0 1.7 2.4V3h3.1z" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
