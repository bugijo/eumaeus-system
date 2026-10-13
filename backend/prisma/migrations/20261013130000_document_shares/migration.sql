CREATE TABLE "DocumentShare" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" INTEGER NOT NULL,
    "documentVersion" INTEGER,
    "recipient" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" INTEGER NOT NULL,
    "lastError" TEXT,
    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DocumentShareEvent" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" INTEGER NOT NULL,
    "shareId" INTEGER NOT NULL,
    "actorUserId" INTEGER NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "DocumentShareEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DocumentShare_clinicId_documentType_documentId_documentVersion_recipient_key" ON "DocumentShare"("clinicId", "documentType", "documentId", "documentVersion", "recipient");
CREATE INDEX "DocumentShare_clinicId_documentType_documentId_idx" ON "DocumentShare"("clinicId", "documentType", "documentId");
CREATE INDEX "DocumentShare_clinicId_status_updatedAt_idx" ON "DocumentShare"("clinicId", "status", "updatedAt");
CREATE INDEX "DocumentShareEvent_clinicId_shareId_createdAt_idx" ON "DocumentShareEvent"("clinicId", "shareId", "createdAt");
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentShareEvent" ADD CONSTRAINT "DocumentShareEvent_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "DocumentShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentShareEvent" ADD CONSTRAINT "DocumentShareEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
