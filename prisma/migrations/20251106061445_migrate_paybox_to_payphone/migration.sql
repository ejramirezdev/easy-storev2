/*
  Warnings:

  - You are about to drop the `PayboxSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."PayboxSettings";

-- CreateTable
CREATE TABLE "PayphoneSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "storeId" TEXT,
    "environment" TEXT,
    "merchantEmail" TEXT,
    "merchantName" TEXT,
    "responseUrl" TEXT,

    CONSTRAINT "PayphoneSettings_pkey" PRIMARY KEY ("id")
);
