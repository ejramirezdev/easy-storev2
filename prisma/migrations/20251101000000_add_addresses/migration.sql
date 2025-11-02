-- Drop existing order address relations so we can rebuild them with the new structure
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_shippingAddressId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_billingAddressId_fkey";

ALTER TABLE "Order"
    DROP COLUMN IF EXISTS "billingAddressId",
    DROP COLUMN IF EXISTS "couponAmount",
    DROP COLUMN IF EXISTS "couponCode",
    DROP COLUMN IF EXISTS "discountTotal",
    DROP COLUMN IF EXISTS "shippingAddressId",
    DROP COLUMN IF EXISTS "shippingTotal",
    DROP COLUMN IF EXISTS "subtotal",
    DROP COLUMN IF EXISTS "taxTotal";

DROP TABLE IF EXISTS "Address";

DROP TYPE IF EXISTS "AddressType";

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING');

CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "type" "AddressType" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "documentType" TEXT,
    "document" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_orderId_type_idx" ON "Address"("orderId", "type");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
