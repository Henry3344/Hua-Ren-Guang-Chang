-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "jobLanguage" TEXT;

-- CreateIndex
CREATE INDEX "Post_jobLanguage_idx" ON "Post"("jobLanguage");
