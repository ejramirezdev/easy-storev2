-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "couponDiscount" DECIMAL(10,2),
ADD COLUMN     "couponType" TEXT,
ADD COLUMN     "couponValue" DECIMAL(10,2),
ADD COLUMN     "shipping" DECIMAL(10,2),
ADD COLUMN     "subtotal" DECIMAL(10,2);
