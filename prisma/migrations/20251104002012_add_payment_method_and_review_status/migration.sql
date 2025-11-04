-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REVIEW';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "receiptUploadedAt" TIMESTAMP(3),
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "selectedBank" TEXT;
