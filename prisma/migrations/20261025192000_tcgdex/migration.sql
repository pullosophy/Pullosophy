-- Sorgente dati TCGdex
ALTER TABLE "CardSet" ADD COLUMN "tcgdexId" TEXT;
CREATE UNIQUE INDEX "CardSet_gameId_tcgdexId_key" ON "CardSet"("gameId", "tcgdexId");
ALTER TABLE "Card" ADD COLUMN "syncedAt" TIMESTAMP(3);
