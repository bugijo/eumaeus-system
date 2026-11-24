-- Abertura e fechamento de caixa.
CREATE TABLE "CashSession" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedById" INTEGER NOT NULL,
    "openingAmount" DECIMAL(12,2) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" INTEGER,
    "expectedCash" DECIMAL(12,2),
    "countedCash" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "closingNote" TEXT,
    "summary" JSONB,
    CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashMovement" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Sale" ADD COLUMN "cashSessionId" INTEGER;

CREATE INDEX "CashSession_clinicId_openedAt_idx" ON "CashSession"("clinicId", "openedAt");
CREATE INDEX "CashMovement_clinicId_sessionId_idx" ON "CashMovement"("clinicId", "sessionId");
-- Garante no banco: no máximo um caixa aberto por estabelecimento.
CREATE UNIQUE INDEX "CashSession_one_open_per_clinic" ON "CashSession"("clinicId") WHERE "status" = 'OPEN';

ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_type_check" CHECK ("type" IN ('SANGRIA', 'SUPRIMENTO'));
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_status_check" CHECK ("status" IN ('OPEN', 'CLOSED'));
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_opening_nonnegative" CHECK ("openingAmount" >= 0);
