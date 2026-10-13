CREATE TABLE "AssistantReminder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "reminderKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "snoozedUntil" TIMESTAMP(3),
    "createdByUserId" INTEGER,
    "resolvedByUserId" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "dismissedReason" TEXT,
    "snoozedReason" TEXT,
    CONSTRAINT "AssistantReminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantReminderAction" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" INTEGER NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "actorUserId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "snoozedUntil" TIMESTAMP(3),
    CONSTRAINT "AssistantReminderAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistantReminder_clinicId_reminderKey_key" ON "AssistantReminder"("clinicId", "reminderKey");
CREATE INDEX "AssistantReminder_clinicId_status_snoozedUntil_idx" ON "AssistantReminder"("clinicId", "status", "snoozedUntil");
CREATE INDEX "AssistantReminder_clinicId_sourceType_sourceId_idx" ON "AssistantReminder"("clinicId", "sourceType", "sourceId");
CREATE INDEX "AssistantReminderAction_clinicId_reminderId_createdAt_idx" ON "AssistantReminderAction"("clinicId", "reminderId", "createdAt");

ALTER TABLE "AssistantReminder" ADD CONSTRAINT "AssistantReminder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssistantReminder" ADD CONSTRAINT "AssistantReminder_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssistantReminderAction" ADD CONSTRAINT "AssistantReminderAction_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "AssistantReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistantReminderAction" ADD CONSTRAINT "AssistantReminderAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
