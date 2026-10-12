-- The legacy Prisma uniqueness may be represented as an index rather than
-- a table constraint on existing databases. Remove it after the scoped index
-- has been created by the preceding migration.
DROP INDEX IF EXISTS "CommunicationOutbox_dedupeKey_key";
