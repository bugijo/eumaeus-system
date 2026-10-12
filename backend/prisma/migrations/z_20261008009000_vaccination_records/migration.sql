ALTER TABLE "MedicalRecord" ADD COLUMN "responsibleUserId" INTEGER;
CREATE TABLE "VaccinationRecord" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "petId" INTEGER NOT NULL,
  "medicalRecordId" INTEGER,
  "responsibleUserId" INTEGER NOT NULL,
  "vaccineName" TEXT NOT NULL,
  "manufacturer" TEXT,
  "lotCode" TEXT,
  "administeredAt" TIMESTAMP(3) NOT NULL,
  "nextDueAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "VaccinationRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VaccinationRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VaccinationRecord_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "VaccinationRecord_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON UPDATE CASCADE
);
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "VaccinationRecord_clinicId_petId_administeredAt_idx" ON "VaccinationRecord"("clinicId", "petId", "administeredAt");
CREATE INDEX "VaccinationRecord_clinicId_nextDueAt_idx" ON "VaccinationRecord"("clinicId", "nextDueAt");
