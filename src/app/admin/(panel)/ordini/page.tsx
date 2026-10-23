import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { updateOrder } from "@/app/actions/admin";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "In attesa di pagamento",
  PAID: "Pagato, da spedire",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
  REFUNDED: "Rimborsato",
};

type Address = { name?: string; address?: Record<string, string | null> };

export default async function OrdersPage() {
  const orders = await db.order.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Ordini</h1>
      {orders.length === 0 && <p className="opacity-70">Nessun ordine ancora.</p>}
      {orders.map((o) => {
        const ship = o.shippingAddress as Address | null;
        const a = ship?.address;
        return (
          <section key={o.id} className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{o.email}</p>
                <p className="text-xs opacity-60">
                  {o.createdAt.toLocaleString("it-IT")} · {o.id}
                </p>
              </div>
              <p className="font-semibold">{formatPrice(o.totalCents)}</p>
            </div>
            <ul className="text-sm">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.quantity} × {i.titleSnapshot} ({formatPrice(i.unitPriceCents)})
                </li>
              ))}
            </ul>
            {a && (
              <p className="text-sm opacity-80">
                {[ship?.name, a.line1, a.line2, [a.postal_code, a.city, a.state].filter(Boolean).join(" "), a.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            <form action={updateOrder} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status} className="rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-1 text-sm">
                {Object.entries(statusLabels).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
              <input
                name="trackingNumber"
                defaultValue={o.trackingNumber ?? ""}
                placeholder="Codice tracking"
                className="rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
              />
              <button className="rounded border border-black/20 dark:border-white/20 px-3 py-1 text-sm">Salva</button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
