import { company, whatsappUrl } from "@/lib/company";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.sellPage.title, description: t.sellPage.metaDescription };
}

export default async function SellPage() {
  const { t } = await getT();
  const p = t.sellPage;
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{p.kicker}</p>
        <h1 className="font-display text-6xl">{p.title}</h1>
        <p className="text-black/60">{p.intro}</p>
      </header>
      <ol className="grid gap-4 sm:grid-cols-3">
        {p.steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl border border-line p-5">
            <span className="font-display text-4xl text-brand">{i + 1}</span>
            <p className="mt-2 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-black/70">{s.text}</p>
          </li>
        ))}
      </ol>
      <section className="rounded-2xl bg-foreground p-8 text-white">
        <p className="font-display text-4xl">{p.ctaTitle}</p>
        <p className="mt-2 text-white/70">{p.ctaText}</p>
        <a
          href={`mailto:${company.email}?subject=${encodeURIComponent(p.mailSubject)}`}
          className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-semibold hover:bg-brand-dark"
        >
          {p.ctaButton} {company.email}
        </a>
        {whatsappUrl(p.mailSubject) && (
          <a
            href={whatsappUrl(p.mailSubject)!}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 ml-3 inline-block rounded-full border border-white/30 px-6 py-3 font-semibold hover:border-brand hover:text-brand"
          >
            {t.footer.whatsapp}
          </a>
        )}
      </section>
    </article>
  );
}
