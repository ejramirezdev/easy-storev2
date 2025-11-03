-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "Order"
  ADD COLUMN "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "discountTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "shippingTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paymentProvider" TEXT,
  ADD COLUMN "paymentToken" TEXT,
  ADD COLUMN "paymentPayload" JSONB,
  ADD COLUMN "paidAt" TIMESTAMP(3);
