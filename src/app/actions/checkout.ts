"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { cartLines, writeCart } from "@/lib/cart";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { getLocale } from "@/lib/i18n";

const schema = z.object({ country: z.string().length(2), email: z.email() });

export async function startCheckout(formData: FormData) {
  const { country, email } = schema.parse(Object.fromEntries(formData));
  const lines = await cartLines();
  if (lines.length === 0) redirect("/carrello");

  const zone = await db.shippingZone.findFirst({ where: { countries: { has: country } } });
  if (!zone) redirect("/carrello?errore=zona");

  const subtotalCents = lines.reduce((sum, l) => sum + l.listing.priceCents * l.quantity, 0);
  const shippingCents = zone.freeOverCents !== null && subtotalCents >= zone.freeOverCents ? 0 : zone.baseCents;

  const order = await db.order.create({
    data: {
      email,
      locale: await getLocale(),
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      shippingCountry: country,
      items: {
        create: lines.map((l) => ({
          listingId: l.listing.id,
          titleSnapshot: l.listing.title,
          unitPriceCents: l.listing.priceCents,
          quantity: l.quantity,
        })),
      },
    },
  });

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  let session;
  try {
    session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "eur",
          unit_amount: l.listing.priceCents,
          product_data: {
            name: l.listing.title,
            images: [l.listing.images[0] ?? l.listing.card?.imageLarge].filter((u): u is string => !!u),
          },
        },
      })),
      shipping_address_collection: {
        allowed_countries: [country] as Array<"IT">,
      },
      allow_promotion_codes: true,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `Spedizione ${zone.name}`,
            fixed_amount: { amount: shippingCents, currency: "eur" },
          },
        },
      ],
      success_url: `${origin}/ordine/grazie?id=${order.id}`,
      cancel_url: `${origin}/carrello`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });
  } catch (err) {
    // Niente ordini orfani se Stripe rifiuta la richiesta.
    await db.$transaction([
      db.orderItem.deleteMany({ where: { orderId: order.id } }),
      db.order.delete({ where: { id: order.id } }),
    ]);
    // Il dettaglio finisce nei log di Vercel; al cliente un messaggio leggibile.
    console.error("[checkout] Stripe error:", err);
    const code =
      err instanceof Stripe.errors.StripeError ? err.type : err instanceof Error && /STRIPE_SECRET_KEY/.test(err.message) ? "config" : "unknown";
    redirect(`/carrello?errore=${encodeURIComponent(code)}`);
  }

  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  await writeCart({});
  redirect(session.url!);
}
