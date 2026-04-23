-- CreateTable
CREATE TABLE "LocationSuggestion" (
    "id" TEXT NOT NULL,
    "stateText" TEXT NOT NULL,
    "cityText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationSuggestion_pkey" PRIMARY KEY ("id")
);
