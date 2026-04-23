-- CreateTable
CREATE TABLE "AiSearchTrace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "retrievalQuery" TEXT NOT NULL,
    "queryEmbedding" JSONB,
    "retrievalW" DOUBLE PRECISION NOT NULL,
    "businessW" DOUBLE PRECISION NOT NULL,
    "freshnessW" DOUBLE PRECISION NOT NULL,
    "priceIntentHeur" BOOLEAN NOT NULL DEFAULT false,
    "mergeIntentLlmOk" BOOLEAN NOT NULL DEFAULT false,
    "semanticPriceHint" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSearchTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSearchInteractionEvent" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "dwellMs" INTEGER,
    "clickSeq" INTEGER,
    "clientMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSearchInteractionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRankWeightState" (
    "id" TEXT NOT NULL,
    "retrievalW" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "businessW" DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    "freshnessW" DOUBLE PRECISION NOT NULL DEFAULT 0.16,
    "impressionTotal" INTEGER NOT NULL DEFAULT 0,
    "clickTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRankWeightState_pkey" PRIMARY KEY ("id")
);

-- Insert default weight row
INSERT INTO "AiRankWeightState" ("id", "retrievalW", "businessW", "freshnessW", "impressionTotal", "clickTotal", "updatedAt")
VALUES ('default', 0.30, 0.06, 0.16, 0, 0, CURRENT_TIMESTAMP);

-- AddForeignKey
ALTER TABLE "AiSearchTrace" ADD CONSTRAINT "AiSearchTrace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSearchInteractionEvent" ADD CONSTRAINT "AiSearchInteractionEvent_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "AiSearchTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSearchInteractionEvent" ADD CONSTRAINT "AiSearchInteractionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSearchInteractionEvent" ADD CONSTRAINT "AiSearchInteractionEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "AiSearchTrace_userId_createdAt_idx" ON "AiSearchTrace"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiSearchInteractionEvent_traceId_createdAt_idx" ON "AiSearchInteractionEvent"("traceId", "createdAt");

-- CreateIndex
CREATE INDEX "AiSearchInteractionEvent_userId_createdAt_idx" ON "AiSearchInteractionEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiSearchInteractionEvent_postId_idx" ON "AiSearchInteractionEvent"("postId");
