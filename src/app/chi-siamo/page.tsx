import Link from "next/link";
import { socials } from "@/lib/company";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.aboutPage.title, description: t.aboutPage.metaDescription };
}

export default async function AboutPage() {
  const { t } = await getT();
  const p = t.aboutPage;
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{p.kicker}</p>
        <h1 className="font-display text-5xl sm:text-6xl">{p.title}</h1>
      </header>
      <div className="space-y-4 text-lg leading-relaxed text-black/80">
        {p.paragraphs.map((para) => (
          <p key={para}>{para}</p>
        ))}
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {p.values.map((v) => (
          <li key={v.title} className="rounded-2xl border border-line p-5">
            <p className="font-semibold">{v.title}</p>
            <p className="mt-1 text-sm text-black/70">{v.text}</p>
          </li>
        ))}
      </ul>
      <section className="rounded-2xl bg-foreground p-8 text-white">
        <p className="font-display text-4xl">{p.ctaTitle}</p>
        <p className="mt-2 text-white/70">{p.ctaText}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pokemon" className="rounded-full bg-brand px-6 py-3 font-semibold hover:bg-brand-dark">
            {p.ctaButton}
          </Link>
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/30 px-6 py-3 font-semibold hover:border-brand hover:text-brand"
            >
              {s.name} {s.handle}
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
