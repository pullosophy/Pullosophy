ALTER TABLE "Customer" ADD COLUMN "phone" TEXT;
ALTER TABLE "Customer" ADD COLUMN "address" JSONB;
ALTER TABLE "Customer" ADD COLUMN "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX "Customer_stripeCustomerId_key" ON "Customer"("stripeCustomerId");
