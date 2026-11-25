-- Assinatura mensal no Mercado Pago (preapproval)
ALTER TABLE "SignupCheckout" ADD COLUMN "mpPreapprovalId" TEXT;
CREATE UNIQUE INDEX "SignupCheckout_mpPreapprovalId_key" ON "SignupCheckout"("mpPreapprovalId");

CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "plan" TEXT NOT NULL,
    "mpPreapprovalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mpStatus" TEXT,
    "promoCents" INTEGER NOT NULL,
    "fullCents" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "priceRaiseAt" TIMESTAMP(3) NOT NULL,
    "priceRaisedAt" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "lastPaymentStatus" TEXT,
    "pastDueSince" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscription_clinicId_key" ON "Subscription"("clinicId");
CREATE UNIQUE INDEX "Subscription_mpPreapprovalId_key" ON "Subscription"("mpPreapprovalId");
CREATE INDEX "Subscription_status_priceRaiseAt_idx" ON "Subscription"("status", "priceRaiseAt");
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
