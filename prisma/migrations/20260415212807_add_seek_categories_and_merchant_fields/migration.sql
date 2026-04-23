/*
  Warnings:

  - Added the required column `category` to the `Merchant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Merchant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'RENT_SEEK';
ALTER TYPE "Category" ADD VALUE 'JOB_SEEK';

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "isDelisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Merchant_status_idx" ON "Merchant"("status");

-- CreateIndex
CREATE INDEX "Merchant_category_idx" ON "Merchant"("category");

-- CreateIndex
CREATE INDEX "Merchant_isPinned_idx" ON "Merchant"("isPinned");
