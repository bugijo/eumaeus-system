ALTER TABLE "PrescriptionItem" ADD COLUMN "clinicId" INTEGER;
UPDATE "PrescriptionItem" i SET "clinicId" = p."clinicId" FROM "Prescription" p WHERE p."id" = i."prescriptionId";
ALTER TABLE "PrescriptionItem" ALTER COLUMN "clinicId" SET NOT NULL;
CREATE INDEX "PrescriptionItem_clinicId_idx" ON "PrescriptionItem"("clinicId");
