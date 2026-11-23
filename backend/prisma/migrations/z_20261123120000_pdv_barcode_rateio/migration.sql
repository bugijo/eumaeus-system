-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "salePrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "allocationGroup" TEXT,
ADD COLUMN     "allocationPercent" DECIMAL(5,2),
ADD COLUMN     "allocationTotal" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "AllocationRule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "shares" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AllocationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "change" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "resultCenterId" INTEGER,
    "tutorId" INTEGER,
    "soldByUserId" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "fiscalDocumentId" TEXT,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "saleId" INTEGER NOT NULL,
    "productId" INTEGER,
    "description" TEXT NOT NULL,
    "barcode" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "saleId" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllocationRule_clinicId_name_key" ON "AllocationRule"("clinicId", "name");

-- CreateIndex
CREATE INDEX "Sale_clinicId_createdAt_idx" ON "Sale"("clinicId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_clinicId_idempotencyKey_key" ON "Sale"("clinicId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_clinicId_number_key" ON "Sale"("clinicId", "number");

-- CreateIndex
CREATE INDEX "SaleItem_clinicId_saleId_idx" ON "SaleItem"("clinicId", "saleId");

-- CreateIndex
CREATE INDEX "SalePayment_clinicId_saleId_idx" ON "SalePayment"("clinicId", "saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_clinicId_barcode_key" ON "Product"("clinicId", "barcode");

-- CreateIndex
CREATE INDEX "Expense_clinicId_allocationGroup_idx" ON "Expense"("clinicId", "allocationGroup");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_resultCenterId_fkey" FOREIGN KEY ("resultCenterId") REFERENCES "ResultCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

