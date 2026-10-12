CREATE TABLE "InvoiceDiscount" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER,
  "invoiceId" INTEGER NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "authorizedByUserId" INTEGER NOT NULL,
  CONSTRAINT "InvoiceDiscount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceDiscount_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InvoiceDiscount_clinicId_invoiceId_idx" ON "InvoiceDiscount"("clinicId", "invoiceId");
