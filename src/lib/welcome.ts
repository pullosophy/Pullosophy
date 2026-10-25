import { stripe } from "@/lib/stripe";

// Codice sconto di benvenuto: configurabile da env, creato su Stripe al primo uso.
export const WELCOME_CODE = (process.env.WELCOME_CODE ?? "BENVENUTO10").toUpperCase();
export const WELCOME_PERCENT = Number(process.env.WELCOME_PERCENT ?? 10);

export async function ensureWelcomeCode() {
  const client = stripe();
  const existing = await client.promotionCodes.list({ code: WELCOME_CODE, limit: 1 });
  if (existing.data[0]) return existing.data[0];
  const coupon = await client.coupons.create({ percent_off: WELCOME_PERCENT, duration: "once", name: `Benvenuto -${WELCOME_PERCENT}%` });
  return client.promotionCodes.create({ promotion: { type: "coupon", coupon: coupon.id }, code: WELCOME_CODE, restrictions: { first_time_transaction: true } });
}
