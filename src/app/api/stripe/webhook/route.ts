import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";

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
    if (orderId && (await markPaid(orderId, session))) await sendConfirmation(orderId);
  } else if (event.type === "checkout.session.expired") {
    const orderId = event.data.object.metadata?.orderId;
    if (orderId) {
      await db.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
    }
  }

  return new Response("ok");
}

// Ritorna true solo la prima volta che l'ordine passa a PAID.
async function markPaid(orderId: string, session: Stripe.Checkout.Session) {
  return db.$transaction(async (tx) => {
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
    if (count === 0) return false;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.listing.update({
        where: { id: item.listingId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    return true;
  });
}

// L'email non deve far fallire il webhook: Stripe altrimenti lo ritenta e l'ordine e' gia' segnato pagato.
async function sendConfirmation(orderId: string) {
  try {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (order) await sendEmail({ to: order.email, ...orderConfirmationEmail(order) });
  } catch (err) {
    console.error("[webhook] email conferma ordine:", err);
  }
}
