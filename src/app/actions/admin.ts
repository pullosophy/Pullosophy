"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";
import { importPokemonCards, importPokemonSets } from "@/lib/pokemon-import";
import { sendEmail } from "@/lib/email";
import { orderShippedEmail } from "@/lib/email-templates";

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
    message = `${await importPokemonSets(db)} espansioni aggiornate`;
  } catch (err) {
    message = `Errore: ${(err as Error).message}`;
  }
  revalidatePath("/admin/espansioni");
  redirect(`/admin/espansioni?ok=${encodeURIComponent(message)}`);
}

export async function importCards(formData: FormData) {
  await requireAdmin();
  const externalId = z.string().min(1).parse(formData.get("externalId"));
  let message: string;
  try {
    const { setName, imported } = await importPokemonCards(db, externalId);
    message = `${setName}: ${imported} carte importate`;
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
    stock: z.coerce.number().int().min(0),
    images: z.string().default(""),
    published: z.preprocess((v) => v === "on", z.boolean()),
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
    stock: v.stock,
    images: v.images
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => /^https:\/\//.test(s)),
    published: v.published,
  };

  const id = formData.get("id");
  if (typeof id === "string" && id) await db.listing.update({ where: { id }, data });
  else await db.listing.create({ data });

  revalidatePath("/admin/prodotti");
  redirect("/admin/prodotti");
}

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
  let notice = "";
  if (status === "SHIPPED" && before?.status !== "SHIPPED") {
    try {
      const sent = await sendEmail({ to: order.email, ...orderShippedEmail(order) });
      notice = "skipped" in sent ? "Email non inviata: RESEND_API_KEY mancante" : `Email di spedizione inviata a ${order.email}`;
    } catch (err) {
      console.error("[admin] email spedizione:", err);
      notice = `Email di spedizione NON inviata: ${(err as Error).message}`;
    }
  }
  revalidatePath("/admin/ordini");
  if (notice) redirect(`/admin/ordini?ok=${encodeURIComponent(notice)}`);
}
