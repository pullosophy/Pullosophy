import Link from "next/link";

const sections = [
  { href: "/pokemon?tipo=single", title: "Carte singole", text: "Ogni carta con lingua e condizione indicate." },
  { href: "/pokemon?tipo=sealed", title: "Sigillati", text: "Booster box, buste, Elite Trainer Box e collezioni." },
  { href: "/pokemon?tipo=graded", title: "Carte gradate", text: "PSA, BGS e CGC, con foto reali di ogni carta." },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold">Pullosophy</h1>
        <p className="text-lg opacity-80">Carte Pokémon per collezionisti e giocatori. Presto anche One Piece.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-lg border border-black/10 dark:border-white/15 p-5 hover:border-current">
            <h2 className="font-semibold text-xl">{s.title}</h2>
            <p className="mt-1 text-sm opacity-75">{s.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
