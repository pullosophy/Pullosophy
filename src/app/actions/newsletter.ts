"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { WELCOME_CODE, WELCOME_PERCENT, ensureWelcomeCode } from "@/lib/welcome";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";

export type SubscribeState = { ok?: boolean; code?: string; error?: "email" | "generic" };

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: "email" };
  try {
    const locale = await getLocale();
    const newReleases = formData.get("newReleases") === "on";
    const interests = formData.getAll("interests").map(String).filter((g) => ["pokemon", "one-piece"].includes(g));
    const prefs = { newReleases, interests };
    await db.subscriber.upsert({
      where: { email: parsed.data },
      update: prefs,
      create: { email: parsed.data, locale, ...prefs },
    });
    // Il codice sconto esiste su Stripe; se Stripe non risponde l'iscrizione resta valida.
    await ensureWelcomeCode().catch((err) => console.error("[newsletter] Stripe promo code:", err));
    // Email con il codice: se fallisce, il codice e' comunque mostrato nel pop-up.
    await sendEmail({ to: parsed.data, ...welcomeEmail(locale, WELCOME_CODE, WELCOME_PERCENT, newReleases) }).catch((err) =>
      console.error("[newsletter] email benvenuto:", err),
    );
    return { ok: true, code: WELCOME_CODE };
  } catch (err) {
    console.error("[newsletter]", err);
    return { error: "generic" };
  }
}
