-- Prezzi di riferimento Cardmarket sulle carte
ALTER TABLE "Card" ADD COLUMN "cmTrendCents" INTEGER;
ALTER TABLE "Card" ADD COLUMN "cmAvgCents" INTEGER;
ALTER TABLE "Card" ADD COLUMN "cmLowCents" INTEGER;
ALTER TABLE "Card" ADD COLUMN "cmUrl" TEXT;
ALTER TABLE "Card" ADD COLUMN "cmUpdatedAt" TIMESTAMP(3);
