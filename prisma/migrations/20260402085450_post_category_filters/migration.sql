-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "itemCondition" TEXT,
ADD COLUMN     "jobTaxType" TEXT,
ADD COLUMN     "jobWorkType" TEXT,
ADD COLUMN     "rentType" TEXT;

-- CreateIndex
CREATE INDEX "Post_rentType_idx" ON "Post"("rentType");

-- CreateIndex
CREATE INDEX "Post_jobWorkType_idx" ON "Post"("jobWorkType");

-- CreateIndex
CREATE INDEX "Post_jobTaxType_idx" ON "Post"("jobTaxType");

-- CreateIndex
CREATE INDEX "Post_itemCondition_idx" ON "Post"("itemCondition");
