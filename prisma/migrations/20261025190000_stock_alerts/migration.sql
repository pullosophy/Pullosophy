-- Avvisi "torna disponibile"
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'it',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StockAlert_email_listingId_key" ON "StockAlert"("email", "listingId");
CREATE INDEX "StockAlert_listingId_idx" ON "StockAlert"("listingId");
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
