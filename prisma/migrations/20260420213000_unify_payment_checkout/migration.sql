CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELED', 'EXPIRED');

CREATE TYPE "CheckoutKind" AS ENUM ('POST_PIN', 'MERCHANT_APPLY', 'AD_PURCHASE', 'AD_RENEW');

ALTER TABLE "Merchant"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "stripeSessionId" TEXT;

ALTER TABLE "Ad"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "stripeSessionId" TEXT;

UPDATE "Merchant"
SET "paidAt" = "createdAt",
    "submittedAt" = COALESCE("submittedAt", "createdAt")
WHERE "paymentStatus" = 'COMPLETED';

UPDATE "Ad"
SET "paidAt" = "createdAt"
WHERE "paymentStatus" = 'COMPLETED';

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CheckoutKind" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "description" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerEmail" TEXT,
    "merchantId" TEXT,
    "adId" TEXT,
    "postId" TEXT,
    "placement" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Merchant_stripeSessionId_key" ON "Merchant"("stripeSessionId");
CREATE UNIQUE INDEX "Ad_stripeSessionId_key" ON "Ad"("stripeSessionId");
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");
CREATE INDEX "Merchant_paymentStatus_status_idx" ON "Merchant"("paymentStatus", "status");
CREATE INDEX "Ad_paymentStatus_endAt_idx" ON "Ad"("paymentStatus", "endAt");
CREATE INDEX "Payment_userId_kind_createdAt_idx" ON "Payment"("userId", "kind", "createdAt");
CREATE INDEX "Payment_merchantId_idx" ON "Payment"("merchantId");
CREATE INDEX "Payment_adId_idx" ON "Payment"("adId");
CREATE INDEX "Payment_postId_idx" ON "Payment"("postId");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
