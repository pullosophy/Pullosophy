"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { WELCOME_CODE, ensureWelcomeCode } from "@/lib/welcome";

export type SubscribeState = { ok?: boolean; code?: string; error?: "email" | "generic" };

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: "email" };
  try {
    const locale = await getLocale();
    await db.subscriber.upsert({ where: { email: parsed.data }, update: {}, create: { email: parsed.data, locale } });
    // Il codice sconto esiste su Stripe; se Stripe non risponde l'iscrizione resta valida.
    await ensureWelcomeCode().catch((err) => console.error("[newsletter] Stripe promo code:", err));
    return { ok: true, code: WELCOME_CODE };
  } catch (err) {
    console.error("[newsletter]", err);
    return { error: "generic" };
  }
}
