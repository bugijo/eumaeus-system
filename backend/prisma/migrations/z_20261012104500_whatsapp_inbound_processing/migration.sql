ALTER TABLE "WhatsAppInboundEvent"
  ADD COLUMN "leaseUntil" TIMESTAMP(3),
  ADD COLUMN "workerId" TEXT,
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "aggregateKey" TEXT,
  ADD COLUMN "sequence" INTEGER,
  ADD COLUMN "occurredAt" TIMESTAMP(3);

CREATE INDEX "WhatsAppInboundEvent_clinicId_aggregateKey_sequence_idx"
  ON "WhatsAppInboundEvent"("clinicId", "aggregateKey", "sequence");
