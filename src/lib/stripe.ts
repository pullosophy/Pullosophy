import Stripe from "stripe";

// Client creato al primo uso, cosi' la build non richiede la chiave.
let client: Stripe | null = null;

export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY mancante");
    client = new Stripe(key);
  }
  return client;
}
