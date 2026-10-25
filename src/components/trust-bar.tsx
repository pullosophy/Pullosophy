import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

const hrefs = ["/spedizioni", "/condizioni-carte", "/termini", "/vendi"];
const payments = ["Visa", "Mastercard", "American Express", "Apple Pay", "Google Pay"];

export function TrustBar({ t }: { t: Dictionary }) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.trust.items.map((it, i) => (
          <Link key={hrefs[i]} href={hrefs[i]} className="rounded-2xl bg-muted p-5 transition hover:bg-line">
            <p className="flex items-center gap-2 font-semibold">
              <span className="h-0.5 w-4 shrink-0 bg-brand" />
              {it.title}
            </p>
            <p className="mt-1 text-sm text-black/60">{it.text}</p>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-black/50">
        <span className="mr-1">{t.trust.payments}</span>
        {payments.map((p) => (
          <span key={p} className="rounded-md border border-line px-2 py-1 font-semibold text-black/70">
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
