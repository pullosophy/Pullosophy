-- Ripristina loghi e simboli delle espansioni importate dalla vecchia Pokémon TCG API,
-- sovrascritti per errore con indirizzi TCGdex non sempre esistenti.
UPDATE "CardSet"
SET "logoUrl"   = 'https://images.pokemontcg.io/' || "externalId" || '/logo.png',
    "symbolUrl" = 'https://images.pokemontcg.io/' || "externalId" || '/symbol.png'
WHERE "externalId" IS NOT NULL;
