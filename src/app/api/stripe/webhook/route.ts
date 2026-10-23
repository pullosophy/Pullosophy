import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// Stripe chiama questo endpoint quando un pagamento va a buon fine o la sessione scade.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("firma mancante", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("firma non valida", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) await markPaid(orderId, session);
  } else if (event.type === "checkout.session.expired") {
    const orderId = event.data.object.metadata?.orderId;
    if (orderId) {
      await db.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
    }
  }

  return new Response("ok");
}

async function markPaid(orderId: string, session: Stripe.Checkout.Session) {
  await db.$transaction(async (tx) => {
    // updateMany con filtro sullo stato rende l'operazione idempotente se Stripe ritenta.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: {
        status: "PAID",
        totalCents: session.amount_total ?? undefined,
        taxCents: session.total_details?.amount_tax ?? 0,
        shippingAddress: (session.collected_information?.shipping_details ?? undefined) as object | undefined,
      },
    });
    if (count === 0) return;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.listing.update({
        where: { id: item.listingId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });
}
