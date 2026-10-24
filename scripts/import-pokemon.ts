// Importa espansioni e carte dalla Pokémon TCG API.
// Uso: npm run import:pokemon -- [setId...]   (senza argomenti importa solo le espansioni)
import { PrismaClient } from "@prisma/client";
import { importPokemonCards, importPokemonSets } from "../src/lib/pokemon-import";

const db = new PrismaClient();

async function main() {
  console.log(`Espansioni: ${await importPokemonSets(db)}`);
  for (const setId of process.argv.slice(2)) {
    const { setName, imported } = await importPokemonCards(db, setId);
    console.log(`${setName}: ${imported} carte`);
  }
}

main().finally(() => db.$disconnect());
