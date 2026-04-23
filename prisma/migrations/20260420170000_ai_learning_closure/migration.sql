-- AlterTable: enrich trace for full feedback loop analysis
ALTER TABLE "AiSearchTrace" ADD COLUMN IF NOT EXISTS "resultCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiSearchTrace" ADD COLUMN IF NOT EXISTS "weightVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable: split recompute cadence by trace vs feedback, and track weight revision
ALTER TABLE "AiRankWeightState" ADD COLUMN IF NOT EXISTS "weightVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AiRankWeightState" ADD COLUMN IF NOT EXISTS "feedbackSignalCountSinceRecompute" INTEGER NOT NULL DEFAULT 0;
