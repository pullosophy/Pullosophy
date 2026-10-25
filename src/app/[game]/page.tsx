import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Condition, ListingKind, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { FilterForm } from "@/components/filter-form";
import { conditionLabels } from "@/lib/labels";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const kinds: Record<string, { kind: ListingKind; label: "singles" | "sealed" | "graded" }> = {
  single: { kind: "SINGLE", label: "singles" },
  sealed: { kind: "SEALED", label: "sealed" },
  graded: { kind: "GRADED", label: "graded" },
};

const sorts: Record<"recenti" | "prezzo-asc" | "prezzo-desc", Prisma.ListingOrderByWithRelationInput> = {
  recenti: { createdAt: "desc" },
  "prezzo-asc": { priceCents: "asc" },
  "prezzo-desc": { priceCents: "desc" },
};
type SortKey = keyof typeof sorts;

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
  const [{ game: slug }, { tipo }, { t }] = await Promise.all([params, searchParams, getT()]);
  const game = await db.game.findUnique({ where: { slug } });
  if (!game) return {};
  const label = tipo && kinds[tipo] ? `${t.nav[kinds[tipo].label]} ${game.name}` : `${t.catalog.cards} ${game.name}`;
  return {
    title: label,
    description: `${label}: ${t.catalog.metaDescription}`,
  };
}

export default async function GamePage({ params, searchParams }: { params: Promise<{ game: string }>; searchParams: Promise<Search> }) {
  const [{ game: slug }, sp, { t }] = await Promise.all([params, searchParams, getT()]);
  const { tipo, set, lingua, cond, q } = sp;
  const ordina: SortKey = sp.ordina && sp.ordina in sorts ? (sp.ordina as SortKey) : "recenti";
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
    db.listing.findMany({ where, include: { card: true, set: true, game: true }, orderBy: sorts[ordina], take: 60 }),
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
    lingua && { label: t.languages[lingua as keyof typeof t.languages] ?? lingua, href: query({ lingua: undefined }) },
    cond && { label: conditionLabels[cond as Condition] ?? cond, href: query({ cond: undefined }) },
    sp.min && { label: `${t.catalog.from} ${sp.min} €`, href: query({ min: undefined }) },
    sp.max && { label: `${t.catalog.upTo} ${sp.max} €`, href: query({ max: undefined }) },
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
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{t.catalog.kicker}</p>
        <h1 className="font-display text-6xl">
          {game.name}
          {tipo && kinds[tipo] && <span className="text-black/30"> · {t.nav[kinds[tipo].label]}</span>}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={query({ tipo: undefined, cond: undefined })} className={pill(!tipo)}>{t.catalog.all}</Link>
        {Object.entries(kinds).map(([key, k]) => (
          <Link key={key} href={query({ tipo: key, cond: key === "single" ? cond : undefined })} className={pill(tipo === key)}>
            {t.nav[k.label]}
          </Link>
        ))}
      </div>

      <FilterForm
        action={`/${game.slug}`}
        labels={{ open: t.catalog.filters, close: t.catalog.hideFilters, apply: t.catalog.apply }}
        defaultOpen={chips.length > 0}
        search={
          <>
            {tipo && <input type="hidden" name="tipo" value={tipo} />}
            <input
              name="q"
              defaultValue={q}
              placeholder={t.catalog.search}
              className="w-full rounded-full border border-line bg-muted px-4 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </>
        }
        filters={
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            <select name="set" defaultValue={set ?? ""} className={`${field} col-span-2`}>
              <option value="">{t.catalog.allSets}</option>
              {sets.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
            <select name="lingua" defaultValue={lingua ?? ""} className={field}>
              <option value="">{t.catalog.allLanguages}</option>
              {languages.map(({ language }) => (
                <option key={language} value={language}>{t.languages[language as keyof typeof t.languages] ?? language}</option>
              ))}
            </select>
            {(!tipo || tipo === "single") && (
              <select name="cond" defaultValue={cond ?? ""} className={field}>
                <option value="">{t.catalog.anyCondition}</option>
                {Object.entries(conditionLabels).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <input name="min" inputMode="decimal" defaultValue={sp.min} placeholder={t.catalog.min} className={field} />
              <input name="max" inputMode="decimal" defaultValue={sp.max} placeholder={t.catalog.max} className={field} />
            </div>
            <select name="ordina" defaultValue={ordina} className={field}>
              {(Object.keys(sorts) as SortKey[]).map((k) => (
                <option key={k} value={k}>{t.catalog.sorts[k]}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-black/50">{total} {total === 1 ? t.catalog.product : t.catalog.products}</span>
        {chips.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-full bg-muted px-3 py-1 hover:bg-line">
            {c.label} ✕
          </Link>
        ))}
        {chips.length > 1 && (
          <Link href={query({ set: undefined, lingua: undefined, cond: undefined, min: undefined, max: undefined, q: undefined })} className="font-semibold hover:text-brand">
            {t.catalog.reset}
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <p className="rounded-2xl bg-muted p-10 text-center text-black/60">{t.catalog.empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
