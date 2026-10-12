ALTER TABLE "Expense" ADD COLUMN "createdById" INTEGER;

CREATE TABLE "FinancialAuditEvent" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "eventType" TEXT NOT NULL,
  "expenseId" INTEGER,
  "actorUserId" INTEGER NOT NULL,
  "metadata" JSONB,
  CONSTRAINT "FinancialAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinancialAuditEvent_clinicId_eventType_createdAt_idx" ON "FinancialAuditEvent"("clinicId", "eventType", "createdAt");
CREATE INDEX "FinancialAuditEvent_clinicId_expenseId_idx" ON "FinancialAuditEvent"("clinicId", "expenseId");
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialAuditEvent" ADD CONSTRAINT "FinancialAuditEvent_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialAuditEvent" ADD CONSTRAINT "FinancialAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
