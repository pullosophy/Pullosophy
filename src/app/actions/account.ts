"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { claimOrders, createSession, destroySession, getCustomer, hashPassword, verifyPassword } from "@/lib/customer-auth";
import { getLocale } from "@/lib/i18n";

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

export async function requireCustomer() {
  const c = await getCustomer();
  if (!c) redirect("/accedi");
  return c;
}
