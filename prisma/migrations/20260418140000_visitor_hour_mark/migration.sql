-- CreateTable
CREATE TABLE IF NOT EXISTS "VisitorHourMark" (
    "visitorHash" TEXT NOT NULL,
    "hourSlot" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorHourMark_pkey" PRIMARY KEY ("visitorHash","hourSlot")
);

CREATE INDEX IF NOT EXISTS "VisitorHourMark_hourSlot_idx" ON "VisitorHourMark"("hourSlot");
