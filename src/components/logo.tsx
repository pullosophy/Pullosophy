import Link from "next/link";

// Logo testuale come quello ufficiale: PULL nero, OSOPHY rosso, carattere condensato.
export function Logo({ subline = false, className = "" }: { subline?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="Pullosophy, home" className={`inline-flex flex-col ${className}`}>
      <span className="font-display text-[2rem] leading-none">
        PULL<span className="text-brand">OSOPHY</span>
      </span>
      {subline && (
        <span className="mt-1 flex items-center gap-2 text-[0.6rem] font-semibold tracking-[0.25em] uppercase">
          <span className="h-0.5 w-4 bg-brand" />
          Carte collezionabili · Mantova
        </span>
      )}
    </Link>
  );
}
