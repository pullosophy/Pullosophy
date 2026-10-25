import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.shippingPage.title, description: t.shippingPage.metaDescription };
}

export default async function ShippingPage() {
  const [zones, { locale, t }] = await Promise.all([db.shippingZone.findMany({ orderBy: { baseCents: "asc" } }), getT()]);
  const countryNames = new Intl.DisplayNames([locale], { type: "region" });
  const p = t.shippingPage;
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{t.infoKicker}</p>
        <h1 className="font-display text-6xl">{p.title}</h1>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-4xl">{p.costs}</h2>
        <p>
          {p.intro1} <strong>{p.intro2}</strong> {p.intro3} <strong>{p.intro4}</strong>.
        </p>
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3 font-semibold">{p.zone}</th>
                <th className="p-3 font-semibold">{p.cost}</th>
                <th className="p-3 font-semibold">{p.freeFrom}</th>
                <th className="p-3 font-semibold">{p.eta}</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-t border-line align-top">
                  <td className="p-3">
                    <p className="font-medium">{z.name}</p>
                    {z.countries.length > 1 && (
                      <p className="mt-1 text-xs text-black/50">
                        {z.countries.map((c) => countryNames.of(c) ?? c).sort((a, b) => a.localeCompare(b, locale)).join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="p-3">{formatPrice(z.baseCents)}</td>
                  <td className="p-3">{z.freeOverCents !== null ? formatPrice(z.freeOverCents) : "—"}</td>
                  <td className="p-3">{z.countries.length === 1 ? p.etaIt : p.etaEu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-4xl">{p.packing}</h2>
        <ul className="list-disc space-y-1 pl-5">
          {p.packingItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-4xl">{p.returns}</h2>
        <p>{p.returnsText}</p>
      </section>
    </article>
  );
}
