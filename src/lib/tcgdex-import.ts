// Import di espansioni, carte e prezzi Cardmarket da TCGdex (https://tcgdex.dev): gratuita, senza chiave.
import type { PrismaClient } from "@prisma/client";

const API = process.env.TCGDEX_API ?? "https://api.tcgdex.net/v2/en";
// Stessa API in italiano: stessi id, nomi tradotti (non tutte le espansioni sono tradotte).
const API_IT = API.replace(/\/en$/, "/it");
const CONCURRENCY = 8;
const TIME_BUDGET_MS = 40_000; // l'azione admin ha 60 s: ci fermiamo prima e si riprende al clic successivo
const FRESH_MS = 12 * 60 * 60 * 1000; // carte scaricate nelle ultime 12 ore non vengono richieste di nuovo

type SetResume = { id: string; name: string; logo?: string; symbol?: string; cardCount: { total: number; official: number } };
type CardResume = { id: string; localId: string; name: string; image?: string };
type SetDetail = SetResume & { releaseDate?: string; serie?: { id: string; name: string }; cards: CardResume[] };
type CardDetail = CardResume & {
  rarity?: string;
  category?: string;
  pricing?: {
    cardmarket?: {
      updated?: string;
      avg?: number;
      low?: number;
      trend?: number;
      "avg-holo"?: number;
      "low-holo"?: number;
      "trend-holo"?: number;
    } | null;
  } | null;
};

const cents = (v?: number | null) => (typeof v === "number" && v > 0 ? Math.round(v * 100) : null);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Parole che non distinguono un'espansione dall'altra ("Pokémon Futsal Collection" e "Pokémon Futsal 2020" sono la stessa).
const GENERIC = new Set(["pokemon", "set", "the", "tcg", "edition", "and", "of"]);
const tokens = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/é/g, "e")
      .split(/[^a-z0-9]+/)
      .filter((t) => t && !GENERIC.has(t) && !/^(19|20)\d\d$/.test(t)),
  );
const subset = (a: Set<string>, b: Set<string>) => a.size > 0 && [...a].every((t) => b.has(t));
// Quanto si somigliano due nomi: 1 = uguali, 0 = niente in comune. Un nome contenuto nell'altro conta per le parole in comune.
function similarity(a: string, b: string) {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  const ta = tokens(a);
  const tb = tokens(b);
  const contained = (na.length >= 5 && nb.length >= 5 && (na.includes(nb) || nb.includes(na))) || subset(ta, tb) || subset(tb, ta);
  if (!contained) return 0;
  const union = new Set([...ta, ...tb]);
  return [...ta].filter((t) => tb.has(t)).length / Math.max(union.size, 1);
}

// Pokémon TCG Pocket e' il gioco per telefono: su TCGdex ha la serie "tcgp" e codici come A1, A1a, B2a, P-A.
// Non si vendono carte fisiche, quindi non va nel catalogo.
const POCKET_SERIES = "tcgp";
const looksPocket = (id: string) => /^(?:[A-Z]\d+[a-z]?|P-[A-Z]+)$/.test(id);
// Vale anche per espansioni gia' salvate: dal codice TCGdex o dal nome della serie.
export const isPocketSet = (s: { tcgdexId: string | null; series: string | null }) =>
  (!!s.tcgdexId && looksPocket(s.tcgdexId)) || /pocket/i.test(s.series ?? "");
async function pocketIds(): Promise<Set<string>> {
  const serie = await get<{ sets?: { id: string }[] }>(`/series/${POCKET_SERIES}`).catch(() => null);
  return new Set(serie?.sets?.map((s) => s.id) ?? []);
}

async function get<T>(path: string, base = API): Promise<T> {
  let last = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${base}${path}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res.json();
      last = String(res.status);
      if (res.status === 404) throw new Error(`TCGdex: ${path} non trovato`);
      if (res.status < 500 && res.status !== 429) break;
    } catch (err) {
      if ((err as Error).message.startsWith("TCGdex:")) throw err;
      last = err instanceof Error && err.name === "TimeoutError" ? "timeout" : (err as Error).message;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`TCGdex non risponde (${last}): riprova tra qualche minuto`);
}

// Esegue `fn` su ogni elemento con al massimo CONCURRENCY richieste in parallelo.
async function parallel<T>(items: T[], fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

async function pokemonGameId(db: PrismaClient) {
  return (await db.game.findUniqueOrThrow({ where: { slug: "pokemon" } })).id;
}

// Lista espansioni: aggancia quelle gia' presenti (dalla vecchia API) per nome, crea le nuove.
// Poche query (una lettura, scritture solo dove cambia qualcosa) e tempo massimo: al clic successivo continua.
export type ImportOptions = { deadline?: number }; // istante (ms) oltre il quale ci si ferma; default 40 s da adesso

export async function importPokemonSets(db: PrismaClient, opts: ImportOptions = {}) {
  const deadline = opts.deadline ?? Date.now() + TIME_BUDGET_MS;
  const gameId = await pokemonGameId(db);
  const [all, pocket, allIt] = await Promise.all([
    get<SetResume[]>("/sets"),
    pocketIds(),
    API_IT === API ? [] : get<SetResume[]>("/sets", API_IT).catch(() => [] as SetResume[]),
  ]);
  // Nome italiano per id; se TCGdex non l'ha tradotto restituisce quello inglese, che non salviamo.
  const nameIt = new Map(allIt.filter((s) => s.name && s.name !== all.find((e) => e.id === s.id)?.name).map((s) => [s.id, s.name]));
  const isPocket = (id: string) => pocket.has(id) || looksPocket(id);
  const remote = all.filter((r) => !isPocket(r.id));
  const existing = await db.cardSet.findMany({
    where: { gameId },
    select: {
      id: true,
      name: true,
      nameIt: true,
      slug: true,
      externalId: true,
      tcgdexId: true,
      logoUrl: true,
      symbolUrl: true,
      series: true,
      releaseDate: true,
      _count: { select: { cards: true, listings: true } },
    },
  });
  type Existing = (typeof existing)[number];
  const empty = (s: Existing) => s._count.cards === 0 && s._count.listings === 0;
  const byTcgdex = new Map(existing.filter((s) => s.tcgdexId).map((s) => [s.tcgdexId!, s]));
  const unlinked = existing.filter((s) => !s.tcgdexId);
  // Stesso codice nelle due fonti (es. "sv10", "me01"): e' la stessa espansione anche se il nome e' scritto diversamente.
  const byCode = new Map<string, Existing>();
  for (const s of unlinked) {
    if (s.externalId) byCode.set(s.externalId.toLowerCase(), s);
    byCode.set(s.slug.toLowerCase(), s);
  }
  const slugs = new Set(existing.map((s) => s.slug.toLowerCase()));
  const tcgdexAssets = (r: SetResume) => ({
    logoUrl: r.logo ? `${r.logo}.png` : null,
    symbolUrl: r.symbol ? `${r.symbol}.png` : null,
  });
  const ops: (ReturnType<PrismaClient["cardSet"]["update" | "delete"]> | ReturnType<PrismaClient["card"]["deleteMany"]>)[] = [];
  const toCreate: SetResume[] = [];
  let linked = 0;
  let merged = 0;
  let removed = 0;

  // Espansioni Pocket create nei giri precedenti: via, con le loro carte, purche' non ci siano prodotti in vendita.
  for (const s of existing) {
    if (((s.tcgdexId && isPocket(s.tcgdexId)) || isPocketSet(s)) && s._count.listings === 0) {
      ops.push(db.card.deleteMany({ where: { setId: s.id } }), db.cardSet.delete({ where: { id: s.id } }));
      removed++;
    }
  }

  // Abbinamento tra espansioni TCGdex e quelle vecchie non ancora collegate: prima la coppia che si somiglia di piu',
  // ognuna usata una volta sola (cosi' "30th Celebration" non si prende "30th Celebration: Classic Collection").
  // Stesso codice = stessa espansione anche se il nome e' scritto in modo diverso.
  const pairs: { r: SetResume; s: Existing; score: number }[] = [];
  for (const r of remote) {
    const code = byCode.get(r.id.toLowerCase());
    for (const s of unlinked) {
      const score = s === code ? 2 : similarity(r.name, s.name);
      if (score > 0) pairs.push({ r, s, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const matched = new Map<string, Existing>(); // tcgdexId -> vecchia espansione
  const takenOld = new Set<string>();
  for (const p of pairs) {
    if (matched.has(p.r.id) || takenOld.has(p.s.id)) continue;
    // Un nome simile ma non uguale vale solo se non ci sono altre candidate altrettanto plausibili.
    if (p.score < 1 && pairs.some((q) => q !== p && q.score === p.score && !matched.has(q.r.id) && !takenOld.has(q.s.id) && (q.r.id === p.r.id || q.s.id === p.s.id))) continue;
    matched.set(p.r.id, p.s);
    takenOld.add(p.s.id);
  }

  for (const r of remote) {
    const assets = tcgdexAssets(r);
    const known = byTcgdex.get(r.id);
    const old = matched.get(r.id);
    if (known && old) {
      // Doppione: TCGdex l'ha creata con un altro nome (es. "30th Classic Collection") mentre la vecchia
      // ("30th Celebration: Classic Collection") e' rimasta scollegata. Teniamo quella con le carte.
      if (empty(known)) {
        ops.push(
          db.cardSet.delete({ where: { id: known.id } }),
          db.cardSet.update({
            where: { id: old.id },
            data: {
              tcgdexId: r.id,
              nameIt: nameIt.get(r.id) ?? old.nameIt ?? known.nameIt,
              logoUrl: old.logoUrl ?? known.logoUrl ?? assets.logoUrl,
              symbolUrl: old.symbolUrl ?? known.symbolUrl ?? assets.symbolUrl,
              series: old.series ?? known.series,
              releaseDate: old.releaseDate ?? known.releaseDate,
            },
          }),
        );
        merged++;
        continue;
      }
      if (empty(old)) {
        ops.push(
          db.cardSet.delete({ where: { id: old.id } }),
          db.cardSet.update({
            where: { id: known.id },
            data: {
              nameIt: nameIt.get(r.id) ?? known.nameIt ?? old.nameIt,
              logoUrl: known.logoUrl ?? old.logoUrl ?? assets.logoUrl,
              symbolUrl: known.symbolUrl ?? old.symbolUrl ?? assets.symbolUrl,
              series: known.series ?? old.series,
              releaseDate: known.releaseDate ?? old.releaseDate,
            },
          }),
        );
        merged++;
        continue;
      }
      // altrimenti hanno carte entrambe: le lasciamo, si uniscono a mano
    }
    if (known) {
      // Loghi e simboli TCGdex solo dove mancano: quelli gia' presenti (vecchia API) restano, perche' su TCGdex non tutti esistono.
      const it = nameIt.get(r.id);
      const data = {
        ...(it && it !== known.nameIt ? { nameIt: it } : {}),
        ...(known.logoUrl || !assets.logoUrl ? {} : { logoUrl: assets.logoUrl }),
        ...(known.symbolUrl || !assets.symbolUrl ? {} : { symbolUrl: assets.symbolUrl }),
      };
      if (Object.keys(data).length) ops.push(db.cardSet.update({ where: { id: known.id }, data }));
      continue;
    }
    if (old) {
      ops.push(
        db.cardSet.update({
          where: { id: old.id },
          data: { tcgdexId: r.id, nameIt: nameIt.get(r.id) ?? old.nameIt, logoUrl: old.logoUrl ?? assets.logoUrl, symbolUrl: old.symbolUrl ?? assets.symbolUrl },
        }),
      );
      linked++;
      continue;
    }
    toCreate.push(r);
  }

  // Tutti gli aggiornamenti in una transazione sola (un viaggio al database invece di centinaia).
  if (ops.length) await db.$transaction(ops);

  // Le nuove hanno bisogno del dettaglio per data di uscita e serie: in parallelo, entro il tempo massimo.
  let created = 0;
  let stopped = false;
  await parallel(toCreate, async (r) => {
    if (stopped || Date.now() > deadline) {
      stopped = true;
      return;
    }
    const d = await get<SetDetail>(`/sets/${encodeURIComponent(r.id)}`).catch(() => null);
    if (d?.serie?.id === POCKET_SERIES || /pocket/i.test(d?.serie?.name ?? "")) {
      created++; // non si vende: la saltiamo e basta
      return;
    }
    await db.cardSet.create({
      data: {
        gameId,
        tcgdexId: r.id,
        slug: slugs.has(r.id.toLowerCase()) ? `tcgdex-${r.id}` : r.id,
        name: r.name,
        nameIt: nameIt.get(r.id) ?? null,
        series: d?.serie?.name ?? null,
        releaseDate: d?.releaseDate ? new Date(d.releaseDate) : null,
        ...tcgdexAssets(r),
      },
    });
    created++;
  });
  return { total: remote.length, created, linked, merged, removed, partial: stopped, remaining: toCreate.length - created };
}

// Carte di un'espansione con prezzi Cardmarket. Si ferma entro il tempo massimo e riprende al clic successivo.
export async function importPokemonCards(db: PrismaClient, setId: string, opts: ImportOptions = {}) {
  const deadline = opts.deadline ?? Date.now() + TIME_BUDGET_MS;
  const set = await db.cardSet.findUniqueOrThrow({ where: { id: setId } });
  if (!set.tcgdexId) {
    throw new Error(`"${set.name}" non è collegata a TCGdex: premi "Aggiorna elenco espansioni" e riprova`);
  }
  const detail = await get<SetDetail>(`/sets/${encodeURIComponent(set.tcgdexId)}`);
  await db.cardSet.update({
    where: { id: set.id },
    data: {
      series: set.series ?? detail.serie?.name ?? null,
      releaseDate: set.releaseDate ?? (detail.releaseDate ? new Date(detail.releaseDate) : null),
      logoUrl: set.logoUrl ?? (detail.logo ? `${detail.logo}.png` : null),
      symbolUrl: set.symbolUrl ?? (detail.symbol ? `${detail.symbol}.png` : null),
    },
  });

  const fresh = await db.card.findMany({
    where: { setId: set.id, syncedAt: { gt: new Date(Date.now() - FRESH_MS) } },
    select: { number: true },
  });
  const skip = new Set(fresh.map((c) => c.number));
  const todo = detail.cards.filter((c) => !skip.has(c.localId));
  let imported = 0;
  let stopped = false;

  await parallel(todo, async (c) => {
    if (stopped || Date.now() > deadline) {
      stopped = true;
      return;
    }
    const card = await get<CardDetail>(`/cards/${encodeURIComponent(c.id)}`);
    const cm = card.pricing?.cardmarket ?? null;
    const image = card.image ?? c.image;
    const fields = {
      name: card.name,
      rarity: card.rarity && card.rarity !== "None" ? card.rarity : null,
      supertype: card.category ?? null,
      ...(image ? { imageSmall: `${image}/low.webp`, imageLarge: `${image}/high.webp` } : {}),
      cmTrendCents: cents(cm?.trend ?? cm?.["trend-holo"]),
      cmAvgCents: cents(cm?.avg ?? cm?.["avg-holo"]),
      cmLowCents: cents(cm?.low ?? cm?.["low-holo"]),
      cmUpdatedAt: cm?.updated ? new Date(cm.updated) : null,
      syncedAt: new Date(),
    };
    const cmUrl = `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(`${card.name} ${c.localId}`)}`;
    await db.card.upsert({
      where: { setId_number: { setId: set.id, number: c.localId } },
      update: { ...fields, cmUrl: fields.cmTrendCents ? cmUrl : undefined },
      create: { ...fields, cmUrl, externalId: c.id, setId: set.id, number: c.localId },
    });
    imported++;
  });

  return { setName: set.name, imported, skipped: skip.size, total: detail.cards.length, partial: stopped };
}
