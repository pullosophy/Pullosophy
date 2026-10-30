"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { claimOrders, createSession, destroySession, getCustomer, hashPassword, verifyPassword } from "@/lib/customer-auth";
import { getLocale } from "@/lib/i18n";
import { revalidatePath } from "next/cache";

// In caso di errore rimandiamo indietro email e nome: React svuota il form dopo l'invio.
export type AccountFormState = { error?: "email" | "password" | "exists" | "credentials" | "generic"; email?: string; name?: string };

const email = z.email().transform((v) => v.trim().toLowerCase());
const password = z.string().min(8).max(200);

export async function register(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const typed = { email: String(formData.get("email") ?? ""), name: String(formData.get("name") ?? "") };
  const e = email.safeParse(typed.email);
  if (!e.success) return { error: "email", ...typed };
  const p = password.safeParse(formData.get("password"));
  if (!p.success) return { error: "password", ...typed };
  const name = typed.name.trim().slice(0, 120) || null;
  if (await db.customer.findUnique({ where: { email: e.data } })) return { error: "exists", ...typed };
  const customer = await db.customer.create({
    data: { email: e.data, passwordHash: hashPassword(p.data), name, locale: await getLocale() },
  });
  await claimOrders(customer.id, customer.email);
  await createSession(customer.id);
  redirect("/account");
}

export async function login(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const typed = { email: String(formData.get("email") ?? "") };
  const e = email.safeParse(typed.email);
  const p = String(formData.get("password") ?? "");
  if (!e.success || !p) return { error: "credentials", ...typed };
  const customer = await db.customer.findUnique({ where: { email: e.data } });
  if (!customer || !verifyPassword(p, customer.passwordHash)) return { error: "credentials", ...typed };
  await claimOrders(customer.id, customer.email);
  await createSession(customer.id);
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export type Address = { line1: string; line2?: string; postalCode: string; city: string; state?: string; country: string };
export type ProfileFormState = { error?: "address" | "generic"; saved?: boolean };
export type PasswordFormState = { error?: "current" | "password" | "generic"; saved?: boolean };
export type DeleteFormState = { error?: "current" | "generic" };

const addressSchema = z.object({
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().min(3).max(16),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().length(2).toUpperCase(),
});

// Dati del profilo: nome, telefono e indirizzo di spedizione predefinito (tutto facoltativo, ma l'indirizzo o e' completo o niente).
export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const customer = await requireCustomer();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120) || null;
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40) || null;
  const raw = Object.fromEntries(["line1", "line2", "postalCode", "city", "state", "country"].map((k) => [k, String(formData.get(k) ?? "")]));
  const empty = !raw.line1 && !raw.postalCode && !raw.city;
  let address: Address | null = null;
  if (!empty) {
    const parsed = addressSchema.safeParse(raw);
    if (!parsed.success) return { error: "address" };
    address = { ...parsed.data, line2: parsed.data.line2 || undefined, state: parsed.data.state || undefined };
  }
  await db.customer.update({ where: { id: customer.id }, data: { name, phone, address: address ?? Prisma.DbNull } });
  // Lo stesso indirizzo va anche sul Customer Stripe, cosi' il checkout lo propone gia' compilato.
  if (customer.stripeCustomerId) {
    try {
      const { stripe } = await import("@/lib/stripe");
      await stripe().customers.update(customer.stripeCustomerId, {
        name: name ?? undefined,
        phone: phone ?? undefined,
        shipping: address
          ? { name: name ?? customer.email, phone: phone ?? undefined, address: { line1: address.line1, line2: address.line2, postal_code: address.postalCode, city: address.city, state: address.state, country: address.country } }
          : undefined,
      });
    } catch (err) {
      console.error("[account] aggiornamento Customer Stripe:", err);
    }
  }
  revalidatePath("/account");
  revalidatePath("/account/dati");
  return { saved: true };
}

export async function changePassword(_prev: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const customer = await requireCustomer();
  const current = String(formData.get("current") ?? "");
  if (!verifyPassword(current, customer.passwordHash)) return { error: "current" };
  const next = password.safeParse(formData.get("password"));
  if (!next.success) return { error: "password" };
  await db.customer.update({ where: { id: customer.id }, data: { passwordHash: hashPassword(next.data) } });
  return { saved: true };
}

// Eliminazione account (GDPR): via cliente e sessioni; gli ordini restano (obbligo fiscale) ma senza collegamento.
export async function deleteAccount(_prev: DeleteFormState, formData: FormData): Promise<DeleteFormState> {
  const customer = await requireCustomer();
  const current = String(formData.get("current") ?? "");
  if (!verifyPassword(current, customer.passwordHash)) return { error: "current" };
  await db.customer.delete({ where: { id: customer.id } });
  await destroySession();
  redirect("/?account=eliminato");
}

export async function requireCustomer() {
  const c = await getCustomer();
  if (!c) redirect("/accedi");
  return c;
}
