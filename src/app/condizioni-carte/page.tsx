import { conditionLabels } from "@/lib/labels";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.conditionsPage.title, description: t.conditionsPage.metaDescription };
}

export default async function ConditionsPage() {
  const { t } = await getT();
  const p = t.conditionsPage;
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{t.infoKicker}</p>
        <h1 className="font-display text-6xl">{p.title}</h1>
        <p className="text-black/60">{p.intro}</p>
      </header>
      <ol className="space-y-3">
        {(Object.keys(conditionLabels) as (keyof typeof conditionLabels)[]).map((key, i) => (
          <li key={key} className="flex gap-4 rounded-2xl border border-line p-4">
            <span className="font-display text-3xl text-brand">{i + 1}</span>
            <div>
              <p className="font-semibold">{conditionLabels[key]}</p>
              <p className="mt-1 text-sm text-black/70">{p.descriptions[key]}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="rounded-2xl bg-muted p-6 text-sm">
        <p className="font-semibold">{p.gradedTitle}</p>
        <p className="mt-1 text-black/70">{p.gradedText}</p>
      </section>
    </article>
  );
}
