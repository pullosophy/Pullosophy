"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finishImportAll, importCardsStep, listSetsToImport } from "@/app/actions/import-all";

type State = { running: boolean; index: number; total: number; current: string; errors: string[]; finished: boolean };
const idle: State = { running: false, index: 0, total: 0, current: "", errors: [], finished: false };

// Scarica le carte di tutte le espansioni, una dopo l'altra, finche' la pagina resta aperta.
export function ImportAll() {
  const [state, setState] = useState<State>(idle);
  const stop = useRef(false);
  const router = useRouter();

  async function run() {
    stop.current = false;
    const sets = await listSetsToImport();
    setState({ ...idle, running: true, total: sets.length });
    const errors: string[] = [];
    for (let i = 0; i < sets.length && !stop.current; i++) {
      const s = sets[i];
      setState((p) => ({ ...p, index: i, current: `${s.name}…` }));
      // Un'espansione puo' richiedere piu' passi: ognuno riprende da dove si era fermato.
      for (let step = 0; step < 30 && !stop.current; step++) {
        const r = await importCardsStep(s.id);
        if (!r.ok) {
          errors.push(`${s.name}: ${r.error}`);
          break;
        }
        setState((p) => ({ ...p, current: `${s.name}: ${r.done}/${r.total} carte`, errors }));
        if (!r.partial) break;
      }
    }
    await finishImportAll();
    setState((p) => ({ ...p, running: false, finished: true, index: sets.length, current: stop.current ? "Fermato" : "Fatto", errors }));
    router.refresh();
  }

  const pct = state.total ? Math.round((state.index / state.total) * 100) : 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {state.running ? (
        <button type="button" onClick={() => (stop.current = true)} className="rounded border border-black/20 px-4 py-2 text-sm font-medium">
          Ferma
        </button>
      ) : (
        <button type="button" onClick={run} className="rounded border border-black/20 px-4 py-2 text-sm font-medium">
          Aggiorna tutte le carte
        </button>
      )}
      {(state.running || state.finished) && (
        <div className="min-w-[16rem] flex-1 text-sm">
          <div className="h-2 overflow-hidden rounded bg-black/10">
            <div className="h-full bg-red-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 opacity-70">
            {state.index}/{state.total} espansioni · {state.current}
            {state.running && " · lascia aperta questa pagina"}
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-1 text-xs text-red-700">
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
