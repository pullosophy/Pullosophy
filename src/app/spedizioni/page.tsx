import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spedizioni e resi", description: "Costi, tempi di spedizione e resi di Pullosophy, da Mantova a tutta Europa." };

const countryNames = new Intl.DisplayNames(["it"], { type: "region" });

export default async function ShippingPage() {
  const zones = await db.shippingZone.findMany({ orderBy: { baseCents: "asc" } });
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Informazioni</p>
        <h1 className="font-display text-6xl">Spedizioni e resi</h1>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-4xl">Costi e tempi</h2>
        <p>Spediamo da Mantova entro <strong>2 giorni lavorativi</strong> dal pagamento, sempre con <strong>tracciamento</strong>.</p>
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3 font-semibold">Zona</th>
                <th className="p-3 font-semibold">Costo</th>
                <th className="p-3 font-semibold">Gratis da</th>
                <th className="p-3 font-semibold">Consegna stimata</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-t border-line align-top">
                  <td className="p-3">
                    <p className="font-medium">{z.name}</p>
                    {z.countries.length > 1 && (
                      <p className="mt-1 text-xs text-black/50">
                        {z.countries.map((c) => countryNames.of(c) ?? c).sort((a, b) => a.localeCompare(b, "it")).join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="p-3">{formatPrice(z.baseCents)}</td>
                  <td className="p-3">{z.freeOverCents !== null ? formatPrice(z.freeOverCents) : "—"}</td>
                  <td className="p-3">{z.countries.length === 1 ? "2-4 giorni lavorativi" : "4-8 giorni lavorativi"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-4xl">Come imballiamo</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Carte singole in bustina protettiva e <strong>toploader</strong> rigido</li>
          <li>Carte gradate avvolte in pluriball dentro una scatola rigida</li>
          <li>Prodotti sigillati in scatola su misura, mai in semplice busta</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-4xl">Resi</h2>
        <p>
          Hai <strong>14 giorni</strong> dalla consegna per cambiare idea, come previsto dal diritto di recesso europeo. Le carte devono tornare
          nelle stesse condizioni e nella stessa protezione in cui le hai ricevute; i prodotti sigillati devono essere ancora sigillati.
          Scrivici prima di spedire e ti indichiamo come fare. Il rimborso parte entro 14 giorni dal ricevimento del reso.
        </p>
      </section>
    </article>
  );
}
