ALTER TABLE "Prescription" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Prescription" ADD COLUMN "cancelledByUserId" INTEGER;
ALTER TABLE "Prescription" ADD COLUMN "cancelReason" TEXT;
CREATE INDEX "Prescription_cancelledByUserId_idx" ON "Prescription"("cancelledByUserId");
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
