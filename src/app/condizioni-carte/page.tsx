import { conditionLabels } from "@/lib/labels";

export const metadata = { title: "Condizioni delle carte", description: "Come valutiamo le condizioni delle carte singole in vendita su Pullosophy." };

const descriptions: Record<keyof typeof conditionLabels, string> = {
  MINT: "Perfetta sotto ogni aspetto, come appena aperta. Bordi, superficie e angoli senza alcun difetto, anche alla luce.",
  NEAR_MINT: "Al massimo un difetto minimo visibile solo cercandolo con attenzione (un puntino bianco sul bordo, un micrograffio). È la condizione standard delle nostre singole.",
  EXCELLENT: "Qualche piccolo segno di usura: bordi leggermente bianchi o lievi graffi di superficie. Nessuna piega.",
  GOOD: "Usura evidente ma carta integra: bordi bianchi, graffi, piccoli segni. Ottima per giocare, meno per collezionare.",
  LIGHT_PLAYED: "Segni di gioco chiari: angoli arrotondati, graffi diffusi, possibile leggera piega.",
  PLAYED: "Molto usata: pieghe, graffi profondi, bordi rovinati. Il testo resta leggibile.",
  POOR: "Danneggiata: strappi, scritte, macchie o pieghe marcate. Venduta solo come carta da gioco.",
};

export default function ConditionsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Informazioni</p>
        <h1 className="font-display text-6xl">Condizioni delle carte</h1>
        <p className="text-black/60">
          Ogni carta singola viene controllata a mano prima di essere messa in vendita. Usiamo la scala standard del mercato, la stessa di
          Cardmarket, così sai sempre cosa aspettarti.
        </p>
      </header>
      <ol className="space-y-3">
        {(Object.keys(conditionLabels) as (keyof typeof conditionLabels)[]).map((key, i) => (
          <li key={key} className="flex gap-4 rounded-2xl border border-line p-4">
            <span className="font-display text-3xl text-brand">{i + 1}</span>
            <div>
              <p className="font-semibold">{conditionLabels[key]}</p>
              <p className="mt-1 text-sm text-black/70">{descriptions[key]}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="rounded-2xl bg-muted p-6 text-sm">
        <p className="font-semibold">Carte gradate</p>
        <p className="mt-1 text-black/70">
          Per le carte gradate (PSA, BGS, CGC) fa fede il voto dell&apos;ente: in ogni scheda trovi il numero di certificato, che puoi
          verificare sul sito dell&apos;ente, e le foto reali fronte e retro della custodia.
        </p>
      </section>
    </article>
  );
}
