-- CreateTable
CREATE TABLE "TwoFactorToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_token_key" ON "TwoFactorToken"("token");

-- CreateIndex
CREATE INDEX "TwoFactorToken_userId_idx" ON "TwoFactorToken"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorToken_token_idx" ON "TwoFactorToken"("token");

-- CreateIndex
CREATE INDEX "TwoFactorToken_expires_idx" ON "TwoFactorToken"("expires");
