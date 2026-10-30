"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

// Riquadri "Sfoglia per espansione" in home: solo il logo ufficiale su sfondo neutro, nome e numero di prodotti sotto.
// Un'espansione senza logo (o con il segnaposto "retro carta" di TCGdex) non viene mostrata: niente riquadri di solo testo.
// I loghi mancanti si aggiungono da Admin → Espansioni → "Carica logo".
export function SetTiles({
  sets,
  locale,
  productsLabel,
  header,
}: {
  sets: SetTile[];
  locale: Locale;
  productsLabel: string;
  header: React.ReactNode;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visible = sets.filter((s) => s.logoUrl && !hidden.has(s.slug));
  // Con meno di due loghi utilizzabili sparisce tutta la sezione, titolo compreso.
  if (visible.length < 2) return null;
  return (
    <section className="space-y-6">
      {header}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((s) => (
          <Link
            key={s.slug}
            href={`/${s.game.slug}?set=${encodeURIComponent(s.slug)}`}
            className="group flex flex-col rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-foreground hover:shadow-lg"
          >
            <div className="grid h-24 place-items-center rounded-xl bg-muted px-3">
              <Logo
                src={s.logoUrl!}
                onFail={() => setHidden((h) => new Set(h).add(s.slug))}
              />
            </div>
            <p className="mt-3 text-sm font-semibold leading-tight">
              {setName(s, locale)}
            </p>
            <p className="text-xs text-black/50">
              {s._count.listings} {productsLabel}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

const FORMATS = [".png", ".webp", ".jpg"];

// Come SafeImage, ma quando nessun formato esiste (o l'immagine e' verticale, cioe' il segnaposto) avvisa il padre.
function Logo({ src, onFail }: { src: string; onFail: () => void }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  const base = src.replace(/\.(png|webp|jpg|jpeg)$/i, "");
  const current = /\.(png|webp|jpg|jpeg)$/i.test(src) ? base + FORMATS[i] : src;
  const next = () => {
    if (base !== src && i < FORMATS.length - 1) setI(i + 1);
    else onFail();
  };
  const check = (img: HTMLImageElement) => {
    if (img.naturalHeight > img.naturalWidth * 1.1) next();
  };
  // Se l'immagine era gia' caricata prima che React si agganciasse (cache), onLoad non scatta: controlliamo qui.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete) {
      if (img.naturalWidth === 0) next();
      else check(img);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={current}
      alt=""
      loading="lazy"
      className="max-h-20 w-full object-contain transition group-hover:scale-105"
      onError={next}
      onLoad={(e) => check(e.currentTarget)}
    />
  );
}
