CREATE TABLE "Prescription" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "medicalRecordId" INTEGER NOT NULL,
  "veterinarianUserId" INTEGER NOT NULL,
  "reviewedByUserId" INTEGER,
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "clinicNameSnapshot" TEXT NOT NULL,
  "veterinarianNameSnapshot" TEXT NOT NULL,
  "tutorNameSnapshot" TEXT NOT NULL,
  "petNameSnapshot" TEXT NOT NULL,
  "signatureMode" TEXT NOT NULL DEFAULT 'VISUAL_ONLY',
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Prescription_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Prescription_veterinarianUserId_fkey" FOREIGN KEY ("veterinarianUserId") REFERENCES "User"("id") ON UPDATE CASCADE,
  CONSTRAINT "Prescription_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "PrescriptionItem" (
  "id" SERIAL NOT NULL,
  "prescriptionId" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "medication" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "instructions" TEXT,
  CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Prescription_clinicId_medicalRecordId_createdAt_idx" ON "Prescription"("clinicId", "medicalRecordId", "createdAt");
CREATE INDEX "Prescription_clinicId_status_idx" ON "Prescription"("clinicId", "status");
CREATE INDEX "PrescriptionItem_prescriptionId_version_idx" ON "PrescriptionItem"("prescriptionId", "version");
