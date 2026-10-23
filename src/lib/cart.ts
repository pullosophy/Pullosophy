import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Il carrello vive in un cookie: { [listingId]: quantita' }.
const COOKIE = "cart";
export type Cart = Record<string, number>;

export async function readCart(): Promise<Cart> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export async function writeCart(cart: Cart) {
  (await cookies()).set(COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

// Righe del carrello con i dati aggiornati dal database; scarta prodotti non piu' disponibili
// e limita le quantita' alla giacenza.
export async function cartLines() {
  const cart = await readCart();
  const ids = Object.keys(cart);
  if (ids.length === 0) return [];
  const listings = await db.listing.findMany({
    where: { id: { in: ids }, published: true, stock: { gt: 0 } },
    include: { card: true, set: true, game: true },
  });
  return listings.map((listing) => ({
    listing,
    quantity: Math.min(cart[listing.id], listing.stock),
  }));
}
