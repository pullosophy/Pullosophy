"use server";

// "Aggiorna tutte le carte": il browser chiama questi passi uno dopo l'altro finche' la pagina resta aperta.
// Ogni passo lavora al massimo 40 secondi (limite delle azioni su Vercel) e dice se l'espansione e' finita.
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";
import { importPokemonCards, isPocketSet } from "@/lib/tcgdex-import";

async function isAdmin() {
  const token = await adminToken();
  return !!token && (await cookies()).get(ADMIN_COOKIE)?.value === token;
}

export async function listSetsToImport(): Promise<{ id: string; name: string }[]> {
  if (!(await isAdmin())) return [];
  const sets = await db.cardSet.findMany({
    where: { game: { slug: "pokemon" }, tcgdexId: { not: null } },
    select: { id: true, name: true, tcgdexId: true, series: true },
    orderBy: { releaseDate: "desc" },
  });
  // Pokémon TCG Pocket (gioco per telefono) non si vende: niente carte da scaricare.
  return sets.filter((s) => !isPocketSet(s)).map(({ id, name }) => ({ id, name }));
}

export type StepResult =
  | { ok: true; setName: string; done: number; total: number; partial: boolean }
  | { ok: false; error: string };

export async function importCardsStep(setId: string): Promise<StepResult> {
  if (!(await isAdmin())) return { ok: false, error: "sessione scaduta: ricarica la pagina e rientra" };
  try {
    const r = await importPokemonCards(db, setId);
    return { ok: true, setName: r.setName, done: r.imported + r.skipped, total: r.total, partial: r.partial };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function finishImportAll() {
  revalidatePath("/admin/espansioni");
}
