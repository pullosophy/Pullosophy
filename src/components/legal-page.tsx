export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Note legali</p>
        <h1 className="font-display text-6xl">{title}</h1>
        <p className="text-sm text-black/50">Ultimo aggiornamento: {updated}</p>
      </header>
      <div className="legal mt-8 space-y-6 text-[15px] leading-relaxed text-black/80">{children}</div>
    </article>
  );
}
