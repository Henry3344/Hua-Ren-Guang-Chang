-- Add one-time pin trial tracking and adjust default credits

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pinTrialUsedAt" TIMESTAMP(3);

ALTER TABLE "User" ALTER COLUMN "freePinCredits" SET DEFAULT 0;
