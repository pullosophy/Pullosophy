import Link from "next/link";

export const metadata = { title: "Grazie per l'ordine" };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <div className="space-y-3">
      <h1 className="font-display text-6xl">Grazie per l&apos;ordine!</h1>
      <p>Riceverai una email di conferma da Stripe. Ti scriveremo quando l&apos;ordine sarà spedito.</p>
      {id && <p className="text-sm opacity-70">Numero ordine: {id}</p>}
      <Link href="/" className="underline">Torna al negozio</Link>
    </div>
  );
}
