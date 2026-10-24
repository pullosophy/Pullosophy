import { readCart } from "@/lib/cart";

export async function cartCount() {
  const cart = await readCart();
  return Object.values(cart).reduce((sum, n) => sum + (Number(n) || 0), 0);
}
