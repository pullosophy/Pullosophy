import Link from "next/link";

const items = [
  { title: "Spedizione in 2 giorni lavorativi", text: "Tracciata, da Mantova. Gratis in Italia sopra i 100 €.", href: "/spedizioni" },
  { title: "Condizioni verificate a mano", text: "Scala standard del mercato, descritta carta per carta.", href: "/condizioni-carte" },
  { title: "Reso entro 14 giorni", text: "Hai cambiato idea? Rimborso completo, come previsto dalla legge.", href: "/termini" },
  { title: "Vendi le tue carte", text: "Valutazione gratuita, pagamento in contanti o credito negozio.", href: "/vendi" },
];

const payments = ["Visa", "Mastercard", "American Express", "Apple Pay", "Google Pay"];

export function TrustBar() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="rounded-2xl bg-muted p-5 transition hover:bg-line">
            <p className="flex items-center gap-2 font-semibold">
              <span className="h-0.5 w-4 shrink-0 bg-brand" />
              {it.title}
            </p>
            <p className="mt-1 text-sm text-black/60">{it.text}</p>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-black/50">
        <span className="mr-1">Pagamenti sicuri con Stripe:</span>
        {payments.map((p) => (
          <span key={p} className="rounded-md border border-line px-2 py-1 font-semibold text-black/70">
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
