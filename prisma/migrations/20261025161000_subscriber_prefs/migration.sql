-- Preferenze iscritti: avviso nuove uscite e giochi seguiti
ALTER TABLE "Subscriber" ADD COLUMN "newReleases" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Subscriber" ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
