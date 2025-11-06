-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "payphoneClientTransactionId" TEXT,
ADD COLUMN     "payphoneConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "payphonePaymentStartedAt" TIMESTAMP(3),
ADD COLUMN     "payphoneTransactionId" TEXT;
