-- AlterTable: track like/dislike aggregates on rank weight state
ALTER TABLE "AiRankWeightState" ADD COLUMN IF NOT EXISTS "likeTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiRankWeightState" ADD COLUMN IF NOT EXISTS "dislikeTotal" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: message-level feedback
CREATE TABLE "AiChatMessageFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "traceId" TEXT,
    "clientMessageId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "question" TEXT,
    "answer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatMessageFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiChatMessageFeedback_userId_clientMessageId_key"
    ON "AiChatMessageFeedback"("userId", "clientMessageId");

-- CreateIndex
CREATE INDEX "AiChatMessageFeedback_traceId_idx"
    ON "AiChatMessageFeedback"("traceId");

-- CreateIndex
CREATE INDEX "AiChatMessageFeedback_rating_createdAt_idx"
    ON "AiChatMessageFeedback"("rating", "createdAt");

-- CreateIndex
CREATE INDEX "AiChatMessageFeedback_userId_createdAt_idx"
    ON "AiChatMessageFeedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiChatMessageFeedback" ADD CONSTRAINT "AiChatMessageFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatMessageFeedback" ADD CONSTRAINT "AiChatMessageFeedback_traceId_fkey"
    FOREIGN KEY ("traceId") REFERENCES "AiSearchTrace"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
