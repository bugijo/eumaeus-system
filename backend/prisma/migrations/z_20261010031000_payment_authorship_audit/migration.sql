ALTER TABLE "Payment" ADD COLUMN "receivedByUserId" INTEGER;
ALTER TABLE "FinancialAuditEvent" ADD COLUMN "paymentId" INTEGER;
CREATE INDEX "FinancialAuditEvent_clinicId_paymentId_idx" ON "FinancialAuditEvent"("clinicId", "paymentId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialAuditEvent" ADD CONSTRAINT "FinancialAuditEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
