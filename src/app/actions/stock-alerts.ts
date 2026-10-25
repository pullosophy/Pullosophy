"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { sendEmail } from "@/lib/email";
import { restockEmail } from "@/lib/email-templates";

export type StockAlertState = { ok?: boolean; error?: "email" | "generic" };

// "Avvisami quando torna disponibile": salva email + prodotto (una sola volta per coppia).
export async function requestStockAlert(_prev: StockAlertState, formData: FormData): Promise<StockAlertState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  const listingId = String(formData.get("listingId") ?? "");
  if (!email.success) return { error: "email" };
  if (!listingId) return { error: "generic" };
  try {
    const locale = await getLocale();
    await db.stockAlert.upsert({
      where: { email_listingId: { email: email.data, listingId } },
      update: { locale },
      create: { email: email.data, listingId, locale },
    });
    return { ok: true };
  } catch (err) {
    console.error("[stock-alert]", err);
    return { error: "generic" };
  }
}

// Chiamata dall'admin quando un prodotto torna in stock e pubblicato: una email a chi aspettava, poi la riga sparisce.
export async function notifyStockAlerts(listingId: string): Promise<{ sent: number; failed: number; skipped: boolean }> {
  const listing = await db.listing.findUnique({ where: { id: listingId }, include: { game: true, stockAlerts: true } });
  if (!listing || !listing.published || listing.stock <= 0 || listing.stockAlerts.length === 0) return { sent: 0, failed: 0, skipped: false };
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pullosophy.vercel.app";
  const url = `${site}/${listing.game.slug}/p/${listing.id}`;
  let sent = 0;
  let failed = 0;
  let skipped = false;
  for (const alert of listing.stockAlerts) {
    try {
      const res = await sendEmail({ to: alert.email, ...restockEmail(alert.locale, listing, url) });
      if ("skipped" in res && res.skipped) {
        skipped = true;
        break; // manca RESEND_API_KEY: teniamo le richieste per quando sara' configurata
      }
      await db.stockAlert.delete({ where: { id: alert.id } });
      sent++;
    } catch (err) {
      console.error("[stock-alert] invio a", alert.email, err);
      failed++;
    }
  }
  return { sent, failed, skipped };
}
