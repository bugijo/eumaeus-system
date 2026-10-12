CREATE TABLE "ServicePackage" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(12,2) NOT NULL,
  "totalSessions" INTEGER NOT NULL,
  "validityDays" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServicePackage_clinicId_name_key" ON "ServicePackage"("clinicId", "name");
CREATE INDEX "ServicePackage_clinicId_active_idx" ON "ServicePackage"("clinicId", "active");

CREATE TABLE "PackageContract" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "packageId" INTEGER NOT NULL,
  "tutorId" INTEGER NOT NULL,
  "petId" INTEGER NOT NULL,
  "contractedPrice" DECIMAL(12,2) NOT NULL,
  "totalSessions" INTEGER NOT NULL,
  "remainingSessions" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "PackageContract_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PackageContract_clinicId_tutorId_petId_status_idx" ON "PackageContract"("clinicId", "tutorId", "petId", "status");
CREATE INDEX "PackageContract_clinicId_expiresAt_idx" ON "PackageContract"("clinicId", "expiresAt");
ALTER TABLE "PackageContract" ADD CONSTRAINT "PackageContract_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageContract" ADD CONSTRAINT "PackageContract_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageContract" ADD CONSTRAINT "PackageContract_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PackageSession" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversedAt" TIMESTAMP(3),
  "clinicId" INTEGER NOT NULL,
  "contractId" INTEGER NOT NULL,
  "appointmentId" INTEGER NOT NULL,
  CONSTRAINT "PackageSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PackageSession_appointmentId_key" ON "PackageSession"("appointmentId");
CREATE UNIQUE INDEX "PackageSession_clinicId_contractId_appointmentId_key" ON "PackageSession"("clinicId", "contractId", "appointmentId");
CREATE INDEX "PackageSession_clinicId_contractId_reversedAt_idx" ON "PackageSession"("clinicId", "contractId", "reversedAt");
ALTER TABLE "PackageSession" ADD CONSTRAINT "PackageSession_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "PackageContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageSession" ADD CONSTRAINT "PackageSession_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
