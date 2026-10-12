-- Tenant hardening: add nullable scope columns first.
-- Existing rows are intentionally not assigned silently. TenantDataReview records
-- every table requiring an explicit assignment before those rows become visible.
CREATE TABLE "TenantDataReview" (
    "id" SERIAL NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "TenantDataReview_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Pet" ADD COLUMN "clinicId" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "clinicId" INTEGER;
ALTER TABLE "MedicalRecord" ADD COLUMN "clinicId" INTEGER;
ALTER TABLE "MedicalRecordProduct" ADD COLUMN "clinicId" INTEGER;
ALTER TABLE "Product" ADD COLUMN "clinicId" INTEGER;
ALTER TABLE "Service" ADD COLUMN "clinicId" INTEGER;
ALTER TABLE "Service" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Service" ADD COLUMN "category" TEXT;
ALTER TABLE "Service" ADD COLUMN "catalogServiceId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "clinicId" INTEGER;
ALTER TABLE "InvoiceItem" ADD COLUMN "clinicId" INTEGER;

CREATE TABLE "CatalogService" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CatalogService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogService_clinicId_name_key" ON "CatalogService"("clinicId", "name");
CREATE INDEX "CatalogService_clinicId_active_idx" ON "CatalogService"("clinicId", "active");
ALTER TABLE "Service" ADD CONSTRAINT "Service_catalogServiceId_fkey"
  FOREIGN KEY ("catalogServiceId") REFERENCES "CatalogService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'Pet', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "Pet" HAVING COUNT(*) > 0;
INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'Appointment', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "Appointment" HAVING COUNT(*) > 0;
INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'MedicalRecord', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "MedicalRecord" HAVING COUNT(*) > 0;
INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'Product', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "Product" HAVING COUNT(*) > 0;
INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'Invoice', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "Invoice" HAVING COUNT(*) > 0;
