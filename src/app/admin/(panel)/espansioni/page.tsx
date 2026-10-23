import { db } from "@/lib/db";
import { importCards, importSets } from "@/app/actions/admin";
import { SubmitButton } from "../submit-button";

export const maxDuration = 60;

export default async function SetsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const sets = await db.cardSet.findMany({
    where: { game: { slug: "pokemon" } },
    include: { _count: { select: { cards: true } } },
    orderBy: { releaseDate: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Espansioni Pokémon</h1>
        <form action={importSets}>
          <SubmitButton pending="Aggiorno…">Aggiorna elenco espansioni</SubmitButton>
        </form>
      </div>
      {ok && <p className="rounded bg-green-600/15 px-3 py-2 text-sm">{ok}</p>}
      <p className="text-sm opacity-70">
        Importa le carte solo delle espansioni che vendi: servono per creare carte singole e gradate.
      </p>
      {sets.length === 0 ? (
        <p className="opacity-70">Nessuna espansione: premi “Aggiorna elenco espansioni”.</p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {sets.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.symbolUrl && <img src={s.symbolUrl} alt="" className="h-5 w-5 object-contain" />}
              <div className="flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs opacity-60">
                  {s.series} · {s.externalId} · {s._count.cards} carte importate
                </p>
              </div>
              <form action={importCards}>
                <input type="hidden" name="externalId" value={s.externalId ?? ""} />
                <SubmitButton pending="Importo…" variant="outline">
                  {s._count.cards > 0 ? "Aggiorna carte" : "Importa carte"}
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
