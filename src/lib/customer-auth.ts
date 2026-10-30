import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Accesso clienti fatto in casa: password con scrypt (Node, nessuna dipendenza), sessione in tabella
// e cookie con il solo token casuale. Niente segreti da configurare su Vercel.
export const CUSTOMER_COOKIE = "cliente";
const SESSION_DAYS = 90;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const a = scryptSync(password, salt, 64);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.customerSession.create({ data: { token, customerId, expiresAt } });
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await db.customerSession.deleteMany({ where: { token } });
  jar.delete(CUSTOMER_COOKIE);
}

// Cliente loggato, o null. Non tocca il cookie (si puo' usare anche nei server component).
export async function getCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await db.customerSession.findUnique({ where: { token }, include: { customer: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.customer;
}

// Gli ordini fatti da ospite con la stessa email diventano del cliente (alla registrazione e a ogni accesso).
export async function claimOrders(customerId: string, email: string) {
  await db.order.updateMany({ where: { customerId: null, email: { equals: email, mode: "insensitive" } }, data: { customerId } });
}
