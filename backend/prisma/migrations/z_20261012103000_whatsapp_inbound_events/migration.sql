CREATE TABLE "WhatsAppInboundEvent" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clinicId" INTEGER NOT NULL,
  "tutorId" INTEGER NOT NULL,
  "provider" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "externalEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "contactPhone" TEXT,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "correlationKey" TEXT,
  CONSTRAINT "WhatsAppInboundEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppInboundEvent_clinicId_channelId_externalEventId_key"
  ON "WhatsAppInboundEvent"("clinicId", "channelId", "externalEventId");
CREATE INDEX "WhatsAppInboundEvent_clinicId_status_availableAt_idx"
  ON "WhatsAppInboundEvent"("clinicId", "status", "availableAt");
CREATE INDEX "WhatsAppInboundEvent_clinicId_tutorId_createdAt_idx"
  ON "WhatsAppInboundEvent"("clinicId", "tutorId", "createdAt");
CREATE INDEX "WhatsAppInboundEvent_clinicId_correlationKey_idx"
  ON "WhatsAppInboundEvent"("clinicId", "correlationKey");

ALTER TABLE "WhatsAppInboundEvent"
  ADD CONSTRAINT "WhatsAppInboundEvent_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve provisional inbound history in the dedicated table before removing
-- it from the outbound queue. Invalid/ambiguous legacy rows remain in place
-- and therefore require an authorized review instead of being guessed here.
INSERT INTO "WhatsAppInboundEvent" (
  "createdAt", "updatedAt", "clinicId", "tutorId", "provider", "channelId",
  "externalEventId", "eventType", "contactPhone", "payload", "status",
  "attempts", "maxAttempts", "availableAt", "processedAt", "lastError",
  "correlationKey"
)
SELECT
  o."createdAt", o."updatedAt", o."clinicId", o."tutorId", 'WHATSAPP',
  COALESCE(o."payload"->>'channelId', 'legacy-unknown'),
  COALESCE(o."payload"->>'eventId', o."dedupeKey"), o."eventType",
  o."payload"->'source'->>'from', o."payload", 'RECEIVED', o."attempts",
  o."maxAttempts", o."availableAt", NULL, o."lastError", o."dedupeKey"
FROM "CommunicationOutbox" o
WHERE o."category" = 'WHATSAPP_INBOUND'
  AND o."payload"->>'eventId' IS NOT NULL
ON CONFLICT ("clinicId", "channelId", "externalEventId") DO NOTHING;

DELETE FROM "CommunicationOutbox"
WHERE "category" = 'WHATSAPP_INBOUND'
  AND "payload"->>'eventId' IS NOT NULL;
