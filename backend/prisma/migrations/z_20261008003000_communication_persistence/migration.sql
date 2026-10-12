CREATE TABLE "TutorCommunicationPreference" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "tutorId" INTEGER NOT NULL,
  "sender" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "pausedUntil" TIMESTAMP(3),
  "stopAll" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TutorCommunicationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TutorCommunicationPreference_clinicId_tutorId_sender_category_key"
  ON "TutorCommunicationPreference"("clinicId", "tutorId", "sender", "category");
CREATE INDEX "TutorCommunicationPreference_clinicId_tutorId_idx"
  ON "TutorCommunicationPreference"("clinicId", "tutorId");
ALTER TABLE "TutorCommunicationPreference" ADD CONSTRAINT "TutorCommunicationPreference_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CommunicationOutbox" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "tutorId" INTEGER NOT NULL,
  "appointmentId" INTEGER,
  "eventType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "lastError" TEXT,
  CONSTRAINT "CommunicationOutbox_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommunicationOutbox_dedupeKey_key" ON "CommunicationOutbox"("dedupeKey");
CREATE INDEX "CommunicationOutbox_clinicId_status_availableAt_idx" ON "CommunicationOutbox"("clinicId", "status", "availableAt");
CREATE INDEX "CommunicationOutbox_clinicId_tutorId_appointmentId_idx" ON "CommunicationOutbox"("clinicId", "tutorId", "appointmentId");
ALTER TABLE "CommunicationOutbox" ADD CONSTRAINT "CommunicationOutbox_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CommunicationAttempt" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "outboxId" INTEGER NOT NULL,
  "attemptNo" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  CONSTRAINT "CommunicationAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommunicationAttempt_outboxId_attemptNo_key" ON "CommunicationAttempt"("outboxId", "attemptNo");
ALTER TABLE "CommunicationAttempt" ADD CONSTRAINT "CommunicationAttempt_outboxId_fkey"
  FOREIGN KEY ("outboxId") REFERENCES "CommunicationOutbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
