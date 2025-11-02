-- Ensure the user profile table matches the Prisma schema definition
DROP TABLE IF EXISTS "UserProfile";

CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "documentType" TEXT,
    "documentId" TEXT,
    "shippingLine1" TEXT,
    "shippingLine2" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCountry" TEXT DEFAULT 'EC',
    "billingFirstName" TEXT,
    "billingLastName" TEXT,
    "billingEmail" TEXT,
    "billingPhone" TEXT,
    "billingDocumentType" TEXT,
    "billingDocumentId" TEXT,
    "billingLine1" TEXT,
    "billingLine2" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT DEFAULT 'EC',

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserProfile"
    ADD CONSTRAINT "UserProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
