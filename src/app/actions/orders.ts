"use server";

import { z } from "zod";
import { db } from "@/lib/db";

// Ricerca pubblica di un ordine: servono numero (ultimi 8 caratteri dell'id) ed email, insieme.
export async function findOrder(number: string, email: string) {
  const n = number.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const e = z.email().safeParse(email.trim().toLowerCase());
  if (n.length < 6 || !e.success) return null;
  return db.order.findFirst({
    where: { id: { endsWith: n.toLowerCase() }, email: { equals: e.data, mode: "insensitive" } },
    include: { items: true },
  });
}
