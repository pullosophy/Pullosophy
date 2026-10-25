// Importa espansioni e carte da TCGdex.
// Uso: npm run import:pokemon -- [tcgdexSetId...]   (senza argomenti importa solo l'elenco espansioni)
import { PrismaClient } from "@prisma/client";
import { importPokemonCards, importPokemonSets } from "../src/lib/tcgdex-import";

const db = new PrismaClient();

async function main() {
  const r = await importPokemonSets(db);
  console.log(`Espansioni: ${r.total} (${r.created} nuove, ${r.linked} collegate)`);
  for (const tcgdexId of process.argv.slice(2)) {
    const set = await db.cardSet.findFirstOrThrow({ where: { tcgdexId } });
    for (;;) {
      const c = await importPokemonCards(db, set.id);
      console.log(`${c.setName}: ${c.imported + c.skipped}/${c.total} carte${c.partial ? " (continuo…)" : ""}`);
      if (!c.partial) break;
    }
  }
}

main().finally(() => db.$disconnect());
