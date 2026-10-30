"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";
import { importPokemonCards, importPokemonSets } from "@/lib/tcgdex-import";
import { sendEmail } from "@/lib/email";
import { orderShippedEmail } from "@/lib/email-templates";
import { notifyStockAlerts } from "@/app/actions/stock-alerts";

// Ogni azione ricontrolla il cookie: il middleware protegge le pagine, non le server action.
async function requireAdmin() {
  const token = await adminToken();
  if (!token || (await cookies()).get(ADMIN_COOKIE)?.value !== token) redirect("/admin/login");
}

export async function login(formData: FormData) {
  const token = await adminToken();
  const expected = process.env.ADMIN_PASSWORD;
  if (!token || !expected || formData.get("password") !== expected) redirect("/admin/login?errore=1");
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function importSets() {
  await requireAdmin();
  let message: string;
  try {
    const r = await importPokemonSets(db);
    message = `${r.total} espansioni su TCGdex: ${r.created} nuove, ${r.linked} collegate a quelle già presenti`;
    if (r.merged) message += `, ${r.merged} doppioni uniti`;
    if (r.removed) message += `, ${r.removed} di Pokémon TCG Pocket rimosse`;
    if (r.partial) message += `. Ne mancano ${r.remaining}: premi di nuovo "Aggiorna elenco espansioni" per continuare`;
  } catch (err) {
    message = `Errore: ${(err as Error).message}`;
  }
  revalidatePath("/admin/espansioni");
  redirect(`/admin/espansioni?ok=${encodeURIComponent(message)}`);
}

export async function importCards(formData: FormData) {
  await requireAdmin();
  const setId = z.string().min(1).parse(formData.get("setId"));
  let message: string;
  try {
    const r = await importPokemonCards(db, setId);
    const done = r.imported + r.skipped;
    message = r.partial
      ? `${r.setName}: ${done} carte su ${r.total} aggiornate, premi di nuovo "Aggiorna carte" per continuare`
      : `${r.setName}: ${r.total} carte aggiornate con i prezzi Cardmarket`;
  } catch (err) {
    message = `Errore: ${(err as Error).message}`;
  }
  revalidatePath("/admin/espansioni");
  redirect(`/admin/espansioni?ok=${encodeURIComponent(message)}`);
}

// Collega a mano un'espansione vecchia (senza tcgdexId) a una creata da TCGdex: sposta l'id e cancella il doppione vuoto.
export async function linkSet(formData: FormData) {
  await requireAdmin();
  const { setId, targetId } = z.object({ setId: z.string().min(1), targetId: z.string().min(1) }).parse(Object.fromEntries(formData));
  let message: string;
  try {
    const [set, target] = await Promise.all([
      db.cardSet.findUniqueOrThrow({ where: { id: setId } }),
      db.cardSet.findUniqueOrThrow({ where: { id: targetId }, include: { _count: { select: { cards: true, listings: true } } } }),
    ]);
    if (!target.tcgdexId) throw new Error("l'espansione scelta non viene da TCGdex");
    if (target._count.cards > 0 || target._count.listings > 0) throw new Error("l'espansione scelta ha già carte o prodotti: non posso unirla");
    await db.$transaction([
      db.cardSet.delete({ where: { id: target.id } }),
      db.cardSet.update({
        where: { id: set.id },
        data: {
          tcgdexId: target.tcgdexId,
          logoUrl: set.logoUrl ?? target.logoUrl,
          symbolUrl: set.symbolUrl ?? target.symbolUrl,
          releaseDate: set.releaseDate ?? target.releaseDate,
          series: set.series ?? target.series,
        },
      }),
    ]);
    message = `"${set.name}" collegata a TCGdex (${target.tcgdexId}): ora puoi premere "Aggiorna carte"`;
  } catch (err) {
    message = `Errore: ${(err as Error).message}`;
  }
  revalidatePath("/admin/espansioni");
  redirect(`/admin/espansioni?ok=${encodeURIComponent(message)}`);
}

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), schema.optional());

const listingSchema = z
  .object({
    kind: z.enum(["SINGLE", "SEALED", "GRADED"]),
    gameId: z.string().min(1),
    setId: optional(z.string()),
    cardId: optional(z.string()),
    title: z.string().trim().min(1, "Titolo obbligatorio"),
    language: z.string().min(2),
    condition: optional(z.enum(["MINT", "NEAR_MINT", "EXCELLENT", "GOOD", "LIGHT_PLAYED", "PLAYED", "POOR"])),
    sealedType: optional(
      z.enum(["BOOSTER_PACK", "BOOSTER_BOX", "ELITE_TRAINER_BOX", "COLLECTION_BOX", "TIN", "BUNDLE", "BLISTER", "BUILD_BATTLE", "OTHER"]),
    ),
    grader: optional(z.enum(["PSA", "BGS", "CGC", "OTHER"])),
    grade: optional(z.coerce.number().min(1).max(10)),
    certNumber: optional(z.string().trim()),
    price: z.coerce.number().positive("Prezzo obbligatorio"),
    compareAt: optional(z.coerce.number().positive()),
    stock: z.coerce.number().int().min(0),
    images: z.string().default(""),
    description: z.string().trim().default(""),
    published: z.preprocess((v) => v === "on", z.boolean()),
    releaseDate: optional(z.coerce.date()),
  })
  .superRefine((v, ctx) => {
    if (v.kind !== "SEALED" && !v.cardId) ctx.addIssue({ code: "custom", message: "Scegli la carta" });
    if (v.kind === "SINGLE" && !v.condition) ctx.addIssue({ code: "custom", message: "Scegli la condizione" });
    if (v.kind === "SEALED" && !v.sealedType) ctx.addIssue({ code: "custom", message: "Scegli il tipo di sigillato" });
    if (v.kind === "GRADED" && (!v.grader || v.grade === undefined))
      ctx.addIssue({ code: "custom", message: "Indica ente e voto della gradazione" });
  });

export type ListingFormState = { error?: string };

export async function saveListing(_prev: ListingFormState, formData: FormData): Promise<ListingFormState> {
  await requireAdmin();
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  const v = parsed.data;

  // Se e' scelta una carta, l'espansione si ricava da quella.
  const card = v.cardId ? await db.card.findUnique({ where: { id: v.cardId } }) : null;
  const data = {
    kind: v.kind,
    gameId: v.gameId,
    setId: card?.setId ?? v.setId ?? null,
    cardId: v.kind === "SEALED" ? null : (v.cardId ?? null),
    title: v.title,
    language: v.language,
    condition: v.kind === "SINGLE" ? (v.condition ?? null) : null,
    sealedType: v.kind === "SEALED" ? (v.sealedType ?? null) : null,
    grader: v.kind === "GRADED" ? (v.grader ?? null) : null,
    grade: v.kind === "GRADED" ? (v.grade ?? null) : null,
    certNumber: v.kind === "GRADED" ? (v.certNumber ?? null) : null,
    priceCents: Math.round(v.price * 100),
    // Il prezzo barrato ha senso solo se e' piu' alto del prezzo di vendita.
    compareAtCents: v.compareAt && v.compareAt > v.price ? Math.round(v.compareAt * 100) : null,
    stock: v.stock,
    images: v.images
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => /^https:\/\//.test(s)),
    description: v.description || null,
    published: v.published,
    releaseDate: v.releaseDate ?? null,
  };

  const id = formData.get("id");
  let notice = "";
  if (typeof id === "string" && id) {
    await db.listing.update({ where: { id }, data });
    // Tornato disponibile e pubblicato: avvisiamo chi aveva chiesto "Avvisami".
    if (data.stock > 0 && data.published) {
      const r = await notifyStockAlerts(id).catch((err) => {
        console.error("[admin] avvisi torna disponibile:", err);
        return { sent: 0, failed: 1, skipped: false };
      });
      if (r.skipped) notice = "Avvisi \"torna disponibile\" NON inviati: manca RESEND_API_KEY su Vercel";
      else if (r.sent || r.failed) notice = `Avvisi "torna disponibile": ${r.sent} inviati${r.failed ? `, ${r.failed} NON inviati (vedi log)` : ""}`;
    }
  } else await db.listing.create({ data });

  revalidatePath("/admin/prodotti");
  redirect(notice ? `/admin/prodotti?ok=${encodeURIComponent(notice)}` : "/admin/prodotti");
}

const orderStatusLabels: Record<string, string> = {
  PENDING: "In attesa di pagamento",
  PAID: "Pagato, da spedire",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
  REFUNDED: "Rimborsato",
};

export async function updateOrder(formData: FormData) {
  await requireAdmin();
  const { id, status, trackingNumber } = z
    .object({
      id: z.string().min(1),
      status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
      trackingNumber: z.string().trim().default(""),
    })
    .parse(Object.fromEntries(formData));
  const before = await db.order.findUnique({ where: { id }, select: { status: true } });
  const order = await db.order.update({
    where: { id },
    data: { status, trackingNumber: trackingNumber || null },
    include: { items: true },
  });
  // Avviso di spedizione al cliente solo quando l'ordine passa a SPEDITO (non a ogni salvataggio).
  let notice = `Ordine ${order.id.slice(-8).toUpperCase()} salvato: ${orderStatusLabels[status]}`;
  if (status === "SHIPPED" && before?.status !== "SHIPPED") notice += await shippedEmailNotice(order);
  revalidatePath("/admin/ordini");
  redirect(`/admin/ordini?ok=${encodeURIComponent(notice)}`);
}

// Tasto "Reinvia email di spedizione" (es. dopo aver corretto il tracking o configurato Resend).
export async function resendShippingEmail(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const order = await db.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
  const notice = `Ordine ${order.id.slice(-8).toUpperCase()}` + (await shippedEmailNotice(order));
  redirect(`/admin/ordini?ok=${encodeURIComponent(notice)}`);
}

async function shippedEmailNotice(order: Parameters<typeof orderShippedEmail>[0]) {
  try {
    const sent = await sendEmail({ to: order.email, ...orderShippedEmail(order) });
    return "skipped" in sent
      ? ". Email NON inviata: manca RESEND_API_KEY su Vercel (poi serve un Redeploy)"
      : `. Email di spedizione inviata a ${order.email}`;
  } catch (err) {
    console.error("[admin] email spedizione:", err);
    return `. Email NON inviata: ${(err as Error).message}`;
  }
}
