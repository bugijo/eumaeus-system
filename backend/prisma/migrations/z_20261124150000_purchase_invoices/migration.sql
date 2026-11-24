-- Importação de XML de NF-e de compra.
CREATE TABLE "PurchaseInvoice" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" INTEGER NOT NULL,
    "accessKey" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "supplierDocument" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "itemsCount" INTEGER NOT NULL,
    "importedById" INTEGER NOT NULL,
    "expenseId" INTEGER,
    "lines" JSONB NOT NULL,
    "xml" TEXT NOT NULL,
    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierProductLink" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "supplierDocument" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitsPerPackage" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SupplierProductLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PurchaseInvoice_clinicId_accessKey_key" ON "PurchaseInvoice"("clinicId", "accessKey");
CREATE INDEX "PurchaseInvoice_clinicId_createdAt_idx" ON "PurchaseInvoice"("clinicId", "createdAt");
CREATE UNIQUE INDEX "SupplierProductLink_clinicId_supplierDocument_supplierCode_key" ON "SupplierProductLink"("clinicId", "supplierDocument", "supplierCode");
CREATE INDEX "SupplierProductLink_clinicId_productId_idx" ON "SupplierProductLink"("clinicId", "productId");

ALTER TABLE "SupplierProductLink" ADD CONSTRAINT "SupplierProductLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_accessKey_format" CHECK ("accessKey" ~ '^[0-9]{44}$');
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_total_nonnegative" CHECK ("total" >= 0);
ALTER TABLE "SupplierProductLink" ADD CONSTRAINT "SupplierProductLink_units_positive" CHECK ("unitsPerPackage" > 0);
