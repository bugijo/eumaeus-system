-- InvoiceDiscount passa a ser escopado pelo proxy de tenant: todo desconto precisa do clinicId da fatura.
UPDATE "InvoiceDiscount" d
SET "clinicId" = i."clinicId"
FROM "Invoice" i
WHERE d."invoiceId" = i."id"
  AND (d."clinicId" IS NULL OR d."clinicId" <> i."clinicId");
