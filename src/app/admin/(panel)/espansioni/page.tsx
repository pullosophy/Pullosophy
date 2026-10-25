import { db } from "@/lib/db";
import { importCards, importSets, linkSet } from "@/app/actions/admin";
import { SubmitButton } from "../submit-button";
import { ImportAll } from "./import-all";

export const maxDuration = 60;

export default async function SetsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const sets = await db.cardSet.findMany({
    where: { game: { slug: "pokemon" } },
    include: { _count: { select: { cards: true, listings: true } } },
    orderBy: { releaseDate: "desc" },
  });
  // Espansioni create da TCGdex ancora vuote: candidate per collegare a mano quelle vecchie con nome diverso.
  const candidates = sets.filter((s) => s.tcgdexId && s._count.cards === 0 && s._count.listings === 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Espansioni Pokémon</h1>
        <form action={importSets}>
          <SubmitButton pending="Aggiorno…">Aggiorna elenco espansioni</SubmitButton>
        </form>
        <ImportAll />
      </div>
      {ok && (
        <p className={`rounded px-3 py-2 text-sm ${ok.startsWith("Errore") ? "bg-red-600/15" : "bg-green-600/15"}`}>
          {ok}
        </p>
      )}
      <p className="text-sm opacity-70">
        Dati e prezzi arrivano da TCGdex (gratuito, senza chiave). “Aggiorna tutte le carte” scarica tutte le espansioni una dopo l&apos;altra
        (ci vuole un po&apos;: lascia la pagina aperta), oppure importa solo quelle che vendi con il tasto accanto a ciascuna. Con le carte arrivano anche i prezzi di riferimento Cardmarket: premi “Aggiorna carte”
        ogni tanto per averli freschi. Se l&apos;import si ferma a metà, ripremi il tasto: riprende da dove era arrivato. Se un&apos;espansione risulta “non collegata a TCGdex”, scegli
        dal menu “Collega a…” quella con lo stesso contenuto (TCGdex a volte usa un nome diverso) e premi “Collega”.
      </p>
      {sets.length === 0 ? (
        <p className="opacity-70">Nessuna espansione: premi “Aggiorna elenco espansioni”.</p>
      ) : (
        <ul className="divide-y divide-black/10">
          {sets.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.symbolUrl && <img src={s.symbolUrl} alt="" className="h-5 w-5 object-contain" />}
              <div className="flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs opacity-60">
                  {s.series} · {s.tcgdexId ?? "non collegata a TCGdex"} · {s._count.cards} carte importate
                </p>
              </div>
              {s.tcgdexId ? (
                <form action={importCards}>
                  <input type="hidden" name="setId" value={s.id} />
                  <SubmitButton pending="Importo…" variant="outline">
                    {s._count.cards > 0 ? "Aggiorna carte" : "Importa carte"}
                  </SubmitButton>
                </form>
              ) : candidates.length > 0 ? (
                <form action={linkSet} className="flex items-center gap-2">
                  <input type="hidden" name="setId" value={s.id} />
                  <select name="targetId" required className="max-w-[14rem] rounded border border-black/20 px-2 py-2 text-sm">
                    <option value="">Collega a…</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.tcgdexId})
                      </option>
                    ))}
                  </select>
                  <SubmitButton pending="Collego…" variant="outline">Collega</SubmitButton>
                </form>
              ) : (
                <span className="text-xs opacity-60">Premi “Aggiorna elenco espansioni”</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
