import Link from "next/link";
import { db } from "@/lib/db";

export default async function SubscribersPage() {
  const subs = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Iscritti alla newsletter ({subs.length})</h1>
        <Link href="/admin/iscritti/csv" className="rounded bg-foreground px-4 py-2 text-sm font-medium text-white">Scarica CSV</Link>
      </div>
      <p className="text-sm opacity-70">
        Raccolti dal pop-up di benvenuto. Il codice sconto che ricevono è gestito su Stripe (Catalogo prodotti → Coupon).
      </p>
      {subs.length === 0 && <p className="opacity-70">Nessun iscritto ancora.</p>}
      <table className="w-full text-sm">
        <tbody>
          {subs.map((s) => (
            <tr key={s.id} className="border-t border-black/10">
              <td className="py-2 font-medium">{s.email}</td>
              <td className="py-2 uppercase opacity-60">{s.locale}</td>
              <td className="py-2 text-right opacity-60">{s.createdAt.toLocaleDateString("it-IT")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
