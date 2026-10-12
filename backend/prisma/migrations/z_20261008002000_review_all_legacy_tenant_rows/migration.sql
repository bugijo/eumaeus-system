-- Make the ambiguity queue complete before any backfill is attempted.
INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'MedicalRecordProduct', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "MedicalRecordProduct" HAVING COUNT(*) > 0;
INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'Service', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "Service" HAVING COUNT(*) > 0;
INSERT INTO "TenantDataReview" ("tableName", "recordCount", "reason")
SELECT 'InvoiceItem', COUNT(*)::INTEGER, 'Existing rows have no authoritative tenant assignment'
FROM "InvoiceItem" HAVING COUNT(*) > 0;
