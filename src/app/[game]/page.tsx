import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Condition, ListingKind, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { FilterForm } from "@/components/filter-form";
import { conditionLabels, languageLabels } from "@/lib/labels";

export const dynamic = "force-dynamic";

const kinds: Record<string, { kind: ListingKind; label: string }> = {
  single: { kind: "SINGLE", label: "Singole" },
  sealed: { kind: "SEALED", label: "Sigillati" },
  graded: { kind: "GRADED", label: "Gradate" },
};

const sorts: Record<string, { label: string; orderBy: Prisma.ListingOrderByWithRelationInput }> = {
  recenti: { label: "Più recenti", orderBy: { createdAt: "desc" } },
  "prezzo-asc": { label: "Prezzo crescente", orderBy: { priceCents: "asc" } },
  "prezzo-desc": { label: "Prezzo decrescente", orderBy: { priceCents: "desc" } },
};

type Search = {
  tipo?: string;
  set?: string;
  lingua?: string;
  cond?: string;
  min?: string;
  max?: string;
  ordina?: string;
  q?: string;
};

const euroToCents = (v?: string) => {
  const n = Number(v?.replace(",", "."));
  return v && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

export async function generateMetadata({ params, searchParams }: { params: Promise<{ game: string }>; searchParams: Promise<Search> }): Promise<Metadata> {
  const { game: slug } = await params;
  const { tipo } = await searchParams;
  const game = await db.game.findUnique({ where: { slug } });
  if (!game) return {};
  const label = tipo && kinds[tipo] ? `${kinds[tipo].label} ${game.name}` : `Carte ${game.name}`;
  return {
    title: label,
    description: `${label}: singole, sigillati e gradate PSA, BGS, CGC. Spedizione in tutta Europa da Mantova.`,
  };
}

export default async function GamePage({ params, searchParams }: { params: Promise<{ game: string }>; searchParams: Promise<Search> }) {
  const { game: slug } = await params;
  const sp = await searchParams;
  const { tipo, set, lingua, cond, q } = sp;
  const ordina = sp.ordina && sorts[sp.ordina] ? sp.ordina : "recenti";
  const min = euroToCents(sp.min);
  const max = euroToCents(sp.max);

  const game = await db.game.findUnique({ where: { slug } });
  if (!game || !game.active) notFound();

  const base: Prisma.ListingWhereInput = { gameId: game.id, published: true, stock: { gt: 0 } };
  const where: Prisma.ListingWhereInput = {
    ...base,
    kind: tipo ? kinds[tipo]?.kind : undefined,
    set: set ? { slug: set } : undefined,
    language: lingua || undefined,
    condition: cond && cond in conditionLabels ? (cond as Condition) : undefined,
    priceCents: min !== undefined || max !== undefined ? { gte: min, lte: max } : undefined,
    OR: q
      ? [
          { title: { contains: q, mode: "insensitive" } },
          { card: { name: { contains: q, mode: "insensitive" } } },
          { set: { name: { contains: q, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [listings, total, sets, languages] = await Promise.all([
    db.listing.findMany({ where, include: { card: true, set: true, game: true }, orderBy: sorts[ordina].orderBy, take: 60 }),
    db.listing.count({ where }),
    // Solo le espansioni e le lingue che hanno prodotti in vendita.
    db.cardSet.findMany({
      where: { listings: { some: base } },
      select: { slug: true, name: true },
      orderBy: { releaseDate: "desc" },
    }),
    db.listing.findMany({ where: base, distinct: ["language"], select: { language: true } }),
  ]);

  const query = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/${game.slug}${s ? `?${s}` : ""}`;
  };

  const chips: { label: string; href: string }[] = [
    set && { label: sets.find((s) => s.slug === set)?.name ?? set, href: query({ set: undefined }) },
    lingua && { label: languageLabels[lingua] ?? lingua, href: query({ lingua: undefined }) },
    cond && { label: conditionLabels[cond as Condition] ?? cond, href: query({ cond: undefined }) },
    sp.min && { label: `da ${sp.min} €`, href: query({ min: undefined }) },
    sp.max && { label: `fino a ${sp.max} €`, href: query({ max: undefined }) },
    q && { label: `“${q}”`, href: query({ q: undefined }) },
  ].filter((c): c is { label: string; href: string } => !!c);

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium border ${
      active ? "bg-foreground text-white border-foreground" : "border-line hover:border-foreground"
    }`;
  const field = "w-full rounded-full border border-line bg-white px-3 py-2 text-sm";

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Catalogo</p>
        <h1 className="font-display text-6xl">
          {game.name}
          {tipo && kinds[tipo] && <span className="text-black/30"> · {kinds[tipo].label}</span>}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={query({ tipo: undefined, cond: undefined })} className={pill(!tipo)}>Tutto</Link>
        {Object.entries(kinds).map(([key, k]) => (
          <Link key={key} href={query({ tipo: key, cond: key === "single" ? cond : undefined })} className={pill(tipo === key)}>
            {k.label}
          </Link>
        ))}
      </div>

      <FilterForm
        action={`/${game.slug}`}
        defaultOpen={chips.length > 0}
        search={
          <>
            {tipo && <input type="hidden" name="tipo" value={tipo} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Cerca per nome, carta o espansione…"
              className="w-full rounded-full border border-line bg-muted px-4 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </>
        }
        filters={
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            <select name="set" defaultValue={set ?? ""} className={`${field} col-span-2`}>
              <option value="">Tutte le espansioni</option>
              {sets.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
            <select name="lingua" defaultValue={lingua ?? ""} className={field}>
              <option value="">Tutte le lingue</option>
              {languages.map(({ language }) => (
                <option key={language} value={language}>{languageLabels[language] ?? language}</option>
              ))}
            </select>
            {(!tipo || tipo === "single") && (
              <select name="cond" defaultValue={cond ?? ""} className={field}>
                <option value="">Ogni condizione</option>
                {Object.entries(conditionLabels).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <input name="min" inputMode="decimal" defaultValue={sp.min} placeholder="€ min" className={field} />
              <input name="max" inputMode="decimal" defaultValue={sp.max} placeholder="€ max" className={field} />
            </div>
            <select name="ordina" defaultValue={ordina} className={field}>
              {Object.entries(sorts).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-black/50">{total} {total === 1 ? "prodotto" : "prodotti"}</span>
        {chips.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-full bg-muted px-3 py-1 hover:bg-line">
            {c.label} ✕
          </Link>
        ))}
        {chips.length > 1 && (
          <Link href={query({ set: undefined, lingua: undefined, cond: undefined, min: undefined, max: undefined, q: undefined })} className="font-semibold hover:text-brand">
            Azzera filtri
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <p className="rounded-2xl bg-muted p-10 text-center text-black/60">Nessun prodotto con questi filtri.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
