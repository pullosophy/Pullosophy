-- Lingua del cliente per le email dell'ordine
ALTER TABLE "Order" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'it';
