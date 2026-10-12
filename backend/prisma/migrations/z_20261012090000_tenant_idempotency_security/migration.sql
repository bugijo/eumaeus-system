-- Keep idempotency independent between clinics while preserving the existing
-- globally unique keys. Existing global uniqueness guarantees this migration
-- cannot introduce duplicate pairs.
DROP INDEX IF EXISTS "StockMovement_idempotencyKey_key";
CREATE UNIQUE INDEX "StockMovement_clinicId_idempotencyKey_key"
  ON "StockMovement"("clinicId", "idempotencyKey");

DROP INDEX IF EXISTS "CommunicationOutbox_dedupeKey_key";
CREATE UNIQUE INDEX "CommunicationOutbox_clinicId_dedupeKey_key"
  ON "CommunicationOutbox"("clinicId", "dedupeKey");
