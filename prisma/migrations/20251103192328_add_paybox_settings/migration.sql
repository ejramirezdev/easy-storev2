-- CreateTable
CREATE TABLE "PayboxSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "onlyCredit" BOOLEAN NOT NULL DEFAULT false,
    "onlyDebit" BOOLEAN NOT NULL DEFAULT false,
    "blockDeferred" BOOLEAN NOT NULL DEFAULT false,
    "extraFields" BOOLEAN NOT NULL DEFAULT false,
    "recurrentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "planId" TEXT,
    "frequency" TEXT,
    "amountVariable" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "environment" TEXT,
    "merchantEmail" TEXT,
    "merchantName" TEXT,
    "responseUrl" TEXT,
    "confirmationUrl" TEXT,

    CONSTRAINT "PayboxSettings_pkey" PRIMARY KEY ("id")
);
