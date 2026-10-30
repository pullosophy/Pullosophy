import { socials } from "@/lib/company";

// Striscia nera in cima al sito: social a sinistra, messaggi del negozio che scorrono a destra.
// (Prima scorrevano ritagli di carte: troppo piccoli per vedersi bene.)
export function TopStrip({ messages }: { messages: string[] }) {
  const items = messages.filter(Boolean);
  return (
    <div className="relative flex h-10 items-center overflow-hidden bg-foreground text-white">
      <div className="relative z-10 flex h-full shrink-0 items-center gap-3 bg-foreground pl-4 pr-4">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.name} ${s.handle}`}
            className="hover:text-brand"
          >
            <SocialIcon name={s.name} size={18} />
          </a>
        ))}
      </div>
      {items.length > 0 && (
        <div className="top-strip relative h-full min-w-0 flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-foreground to-transparent" />
          <div className="top-strip-track flex h-full w-max items-center">
            {/* lista ripetuta due volte per lo scorrimento continuo */}
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1 ? true : undefined} className="flex h-full items-center">
                {items.map((m, i) => (
                  <li key={i} className="flex items-center whitespace-nowrap text-xs font-medium tracking-wide text-white/90">
                    <span className="mx-5 inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SocialIcon({ name, size = 16 }: { name: string; size?: number }) {
  if (name === "TikTok")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.5 3c.4 2.3 1.9 3.9 4.2 4.1v3.1c-1.6 0-3-.5-4.2-1.3v6.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.2a2.6 2.6 0 1 0 1.7 2.4V3h3.1z" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
