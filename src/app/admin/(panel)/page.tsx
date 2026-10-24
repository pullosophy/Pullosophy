import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export default async function AdminHome() {
  const [published, drafts, toShip, paid] = await Promise.all([
    db.listing.count({ where: { published: true, stock: { gt: 0 } } }),
    db.listing.count({ where: { published: false } }),
    db.order.count({ where: { status: "PAID" } }),
    db.order.aggregate({ where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } }, _sum: { totalCents: true } }),
  ]);
  const stats = [
    { label: "Prodotti in vendita", value: published, href: "/admin/prodotti" },
    { label: "Bozze", value: drafts, href: "/admin/prodotti" },
    { label: "Ordini da spedire", value: toShip, href: "/admin/ordini" },
    { label: "Incassato", value: formatPrice(paid._sum.totalCents ?? 0), href: "/admin/ordini" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-black/10 p-4">
            <p className="text-sm opacity-70">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
          </Link>
        ))}
      </div>
      <Link href="/admin/prodotti/nuovo" className="inline-block rounded bg-foreground text-background px-5 py-2 font-medium">
        + Nuovo prodotto
      </Link>
    </div>
  );
}
