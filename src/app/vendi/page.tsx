import { company } from "@/lib/company";

export const metadata = { title: "Vendi le tue carte", description: "Vendi o scambia le tue carte Pokémon con Pullosophy: valutazione gratuita di singole, sigillati e gradate." };

const steps = [
  { title: "Scrivici", text: "Mandaci la lista delle carte (o le foto, per le più importanti) con lingua e condizione." },
  { title: "Valutazione", text: "Entro 2 giorni lavorativi ti rispondiamo con un'offerta in contanti o in credito negozio, che vale il 10% in più." },
  { title: "Spedisci o passa", text: "Se accetti, ci spedisci le carte con tracciamento oppure ci vediamo a Mantova. Paghiamo dopo il controllo." },
];

export default function SellPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Buylist</p>
        <h1 className="font-display text-6xl">Vendi le tue carte</h1>
        <p className="text-black/60">Compriamo singole, collezioni, prodotti sigillati e carte gradate. Valutazione gratuita e senza impegno.</p>
      </header>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl border border-line p-5">
            <span className="font-display text-4xl text-brand">{i + 1}</span>
            <p className="mt-2 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-black/70">{s.text}</p>
          </li>
        ))}
      </ol>
      <section className="rounded-2xl bg-foreground p-8 text-white">
        <p className="font-display text-4xl">Pronto a vendere?</p>
        <p className="mt-2 text-white/70">Scrivici con la lista delle carte: ti rispondiamo con una valutazione.</p>
        <a href={`mailto:${company.email}?subject=Valutazione%20carte`} className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-semibold hover:bg-brand-dark">
          Scrivi a {company.email}
        </a>
      </section>
    </article>
  );
}
