"use client";

// Al posto della pagina bianca "Application error": spiega e permette di riprovare.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-3 rounded-lg border border-red-600/30 bg-red-600/10 p-4 text-sm">
      <p className="font-semibold">Qualcosa è andato storto.</p>
      <p>
        Di solito succede se un&apos;operazione dura troppo o se la pagina era aperta da prima di un aggiornamento del sito.
        Ricarica la pagina e riprova: le operazioni già fatte sono salvate.
      </p>
      {error.digest && <p className="text-xs opacity-60">Codice: {error.digest}</p>}
      <button onClick={() => window.location.reload()} className="rounded bg-foreground px-4 py-2 text-background">
        Ricarica
      </button>
      <button onClick={reset} className="ml-2 rounded border border-black/20 px-4 py-2">
        Riprova senza ricaricare
      </button>
    </div>
  );
}
