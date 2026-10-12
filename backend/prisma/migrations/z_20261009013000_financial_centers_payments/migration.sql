CREATE TABLE "ResultCenter" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ResultCenter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ResultCenter_clinicId_code_key" ON "ResultCenter"("clinicId", "code");
CREATE INDEX "ResultCenter_clinicId_active_idx" ON "ResultCenter"("clinicId", "active");
ALTER TABLE "Product" ADD COLUMN "resultCenterId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "resultCenterId" INTEGER;
ALTER TABLE "InvoiceItem" ADD COLUMN "resultCenterId" INTEGER;
CREATE TABLE "Payment" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "invoiceId" INTEGER NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'POSTED',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotencyKey" TEXT NOT NULL,
  "reversedAt" TIMESTAMP(3),
  "reversalReason" TEXT,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Payment_clinicId_idempotencyKey_key" ON "Payment"("clinicId", "idempotencyKey");
CREATE INDEX "Payment_clinicId_invoiceId_status_idx" ON "Payment"("clinicId", "invoiceId", "status");
CREATE TABLE "Expense" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "resultCenterId" INTEGER,
  "incurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Expense_clinicId_resultCenterId_incurredAt_idx" ON "Expense"("clinicId", "resultCenterId", "incurredAt");
ALTER TABLE "Product" ADD CONSTRAINT "Product_resultCenterId_fkey" FOREIGN KEY ("resultCenterId") REFERENCES "ResultCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_resultCenterId_fkey" FOREIGN KEY ("resultCenterId") REFERENCES "ResultCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_resultCenterId_fkey" FOREIGN KEY ("resultCenterId") REFERENCES "ResultCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_resultCenterId_fkey" FOREIGN KEY ("resultCenterId") REFERENCES "ResultCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
