CREATE TABLE "HospitalizationAdmission" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "petId" INTEGER NOT NULL,
  "appointmentId" INTEGER,
  "responsibleUserId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ADMITTED',
  "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dischargedAt" TIMESTAMP(3),
  "dischargeReviewedById" INTEGER,
  "dischargeNotes" TEXT,
  "observations" TEXT,
  CONSTRAINT "HospitalizationAdmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HospitalizationAdmission_clinicId_status_idx" ON "HospitalizationAdmission"("clinicId", "status");
CREATE INDEX "HospitalizationAdmission_clinicId_petId_idx" ON "HospitalizationAdmission"("clinicId", "petId");
ALTER TABLE "HospitalizationAdmission" ADD CONSTRAINT "HospitalizationAdmission_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HospitalizationAdmission" ADD CONSTRAINT "HospitalizationAdmission_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HospitalizationAdmission" ADD CONSTRAINT "HospitalizationAdmission_dischargeReviewedById_fkey" FOREIGN KEY ("dischargeReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HospitalizationTask" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "admissionId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "executedAt" TIMESTAMP(3),
  "executedById" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  CONSTRAINT "HospitalizationTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HospitalizationTask_clinicId_admissionId_status_idx" ON "HospitalizationTask"("clinicId", "admissionId", "status");
ALTER TABLE "HospitalizationTask" ADD CONSTRAINT "HospitalizationTask_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "HospitalizationAdmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalizationTask" ADD CONSTRAINT "HospitalizationTask_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HospitalizationPrescription" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "admissionId" INTEGER NOT NULL,
  "medication" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "createdById" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "HospitalizationPrescription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HospitalizationPrescription_clinicId_admissionId_idx" ON "HospitalizationPrescription"("clinicId", "admissionId");
ALTER TABLE "HospitalizationPrescription" ADD CONSTRAINT "HospitalizationPrescription_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "HospitalizationAdmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalizationPrescription" ADD CONSTRAINT "HospitalizationPrescription_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "HospitalizationHandoff" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "admissionId" INTEGER NOT NULL,
  "fromUserId" INTEGER NOT NULL,
  "toUserId" INTEGER NOT NULL,
  "notes" TEXT NOT NULL,
  CONSTRAINT "HospitalizationHandoff_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HospitalizationHandoff_clinicId_admissionId_createdAt_idx" ON "HospitalizationHandoff"("clinicId", "admissionId", "createdAt");
ALTER TABLE "HospitalizationHandoff" ADD CONSTRAINT "HospitalizationHandoff_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "HospitalizationAdmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalizationHandoff" ADD CONSTRAINT "HospitalizationHandoff_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HospitalizationHandoff" ADD CONSTRAINT "HospitalizationHandoff_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SurgeryCase" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "petId" INTEGER NOT NULL,
  "appointmentId" INTEGER,
  "veterinarianId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "scheduledAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "SurgeryCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SurgeryCase_clinicId_status_idx" ON "SurgeryCase"("clinicId", "status");
CREATE INDEX "SurgeryCase_clinicId_petId_idx" ON "SurgeryCase"("clinicId", "petId");
ALTER TABLE "SurgeryCase" ADD CONSTRAINT "SurgeryCase_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SurgeryCase" ADD CONSTRAINT "SurgeryCase_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SurgeryBudgetVersion" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "surgeryId" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "createdById" INTEGER NOT NULL,
  CONSTRAINT "SurgeryBudgetVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SurgeryBudgetVersion_surgeryId_version_key" ON "SurgeryBudgetVersion"("surgeryId", "version");
CREATE INDEX "SurgeryBudgetVersion_clinicId_surgeryId_idx" ON "SurgeryBudgetVersion"("clinicId", "surgeryId");
ALTER TABLE "SurgeryBudgetVersion" ADD CONSTRAINT "SurgeryBudgetVersion_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "SurgeryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SurgeryBudgetVersion" ADD CONSTRAINT "SurgeryBudgetVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SurgeryConsent" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "surgeryId" INTEGER NOT NULL,
  "budgetVersionId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "recordedById" INTEGER NOT NULL,
  CONSTRAINT "SurgeryConsent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SurgeryConsent_clinicId_surgeryId_idx" ON "SurgeryConsent"("clinicId", "surgeryId");
ALTER TABLE "SurgeryConsent" ADD CONSTRAINT "SurgeryConsent_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "SurgeryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SurgeryConsent" ADD CONSTRAINT "SurgeryConsent_budgetVersionId_fkey" FOREIGN KEY ("budgetVersionId") REFERENCES "SurgeryBudgetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SurgeryConsent" ADD CONSTRAINT "SurgeryConsent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SurgeryChecklistItem" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "surgeryId" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "completedById" INTEGER,
  "notes" TEXT,
  CONSTRAINT "SurgeryChecklistItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SurgeryChecklistItem_clinicId_surgeryId_idx" ON "SurgeryChecklistItem"("clinicId", "surgeryId");
ALTER TABLE "SurgeryChecklistItem" ADD CONSTRAINT "SurgeryChecklistItem_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "SurgeryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SurgeryChecklistItem" ADD CONSTRAINT "SurgeryChecklistItem_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SurgeryInstruction" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "surgeryId" INTEGER NOT NULL,
  "instruction" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "approvedById" INTEGER,
  CONSTRAINT "SurgeryInstruction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SurgeryInstruction_clinicId_surgeryId_idx" ON "SurgeryInstruction"("clinicId", "surgeryId");
ALTER TABLE "SurgeryInstruction" ADD CONSTRAINT "SurgeryInstruction_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "SurgeryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SurgeryInstruction" ADD CONSTRAINT "SurgeryInstruction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
