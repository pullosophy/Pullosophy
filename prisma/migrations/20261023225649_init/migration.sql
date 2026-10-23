-- CreateEnum
CREATE TYPE "ListingKind" AS ENUM ('SINGLE', 'SEALED', 'GRADED');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'LIGHT_PLAYED', 'PLAYED', 'POOR');

-- CreateEnum
CREATE TYPE "SealedType" AS ENUM ('BOOSTER_PACK', 'BOOSTER_BOX', 'ELITE_TRAINER_BOX', 'COLLECTION_BOX', 'TIN', 'BUNDLE', 'OTHER');

-- CreateEnum
CREATE TYPE "Grader" AS ENUM ('PSA', 'BGS', 'CGC', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardSet" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "externalId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "releaseDate" TIMESTAMP(3),
    "logoUrl" TEXT,
    "symbolUrl" TEXT,

    CONSTRAINT "CardSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "externalId" TEXT,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" TEXT,
    "supertype" TEXT,
    "imageSmall" TEXT,
    "imageLarge" TEXT,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "kind" "ListingKind" NOT NULL,
    "gameId" TEXT NOT NULL,
    "setId" TEXT,
    "cardId" TEXT,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'it',
    "condition" "Condition",
    "sealedType" "SealedType",
    "grader" "Grader",
    "grade" DECIMAL(3,1),
    "certNumber" TEXT,
    "priceCents" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "subtotalCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "shippingCountry" TEXT,
    "shippingAddress" JSONB,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countries" TEXT[],
    "baseCents" INTEGER NOT NULL,
    "freeOverCents" INTEGER,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CardSet_gameId_slug_key" ON "CardSet"("gameId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CardSet_gameId_externalId_key" ON "CardSet"("gameId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Card_externalId_key" ON "Card"("externalId");

-- CreateIndex
CREATE INDEX "Card_name_idx" ON "Card"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Card_setId_number_key" ON "Card"("setId", "number");

-- CreateIndex
CREATE INDEX "Listing_gameId_kind_published_idx" ON "Listing"("gameId", "kind", "published");

-- CreateIndex
CREATE INDEX "Listing_cardId_idx" ON "Listing"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "CardSet" ADD CONSTRAINT "CardSet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CardSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CardSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
