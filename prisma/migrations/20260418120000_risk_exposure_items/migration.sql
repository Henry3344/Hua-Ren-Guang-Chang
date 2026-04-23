-- CreateTable
CREATE TABLE IF NOT EXISTS "RiskExposureItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskExposureItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RiskExposureItem_sortOrder_createdAt_idx" ON "RiskExposureItem"("sortOrder", "createdAt");
