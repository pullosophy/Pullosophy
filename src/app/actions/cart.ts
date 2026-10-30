"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { readCart, writeCart } from "@/lib/cart";

const schema = z.object({
  listingId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

export async function addToCart(formData: FormData) {
  const { listingId, quantity } = schema.parse(Object.fromEntries(formData));
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.published) return;
  const cart = await readCart();
  cart[listingId] = Math.min((cart[listingId] ?? 0) + Math.max(quantity, 1), listing.stock);
  await writeCart(cart);
  revalidatePath("/carrello");
  // "Acquista ora": dritti al carrello, dove si sceglie il paese e si paga.
  if (formData.get("buyNow")) redirect("/carrello");
}

export async function setQuantity(formData: FormData) {
  const { listingId, quantity } = schema.parse(Object.fromEntries(formData));
  const cart = await readCart();
  if (quantity === 0) delete cart[listingId];
  else cart[listingId] = quantity;
  await writeCart(cart);
  revalidatePath("/carrello");
}
