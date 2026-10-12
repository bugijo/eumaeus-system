ALTER TABLE "Service" ADD COLUMN "resultCenterId" INTEGER;
ALTER TABLE "Service" ADD CONSTRAINT "Service_resultCenterId_fkey" FOREIGN KEY ("resultCenterId") REFERENCES "ResultCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Service_clinicId_resultCenterId_idx" ON "Service"("clinicId", "resultCenterId");
