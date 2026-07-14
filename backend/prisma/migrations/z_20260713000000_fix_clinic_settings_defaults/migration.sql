-- The legacy initializer is named "init-postgres", so this forward-only
-- migration uses a z_ prefix to preserve lexicographic application order.
BEGIN;

ALTER TABLE "public"."ClinicSettings"
  ALTER COLUMN "appointmentReminderTemplate"
    SET DEFAULT 'Olá {tutor}! Não se esqueça da consulta do {pet} amanhã às {hora}. Até logo!',
  ALTER COLUMN "vaccineReminderTemplate"
    SET DEFAULT 'Olá {tutor}! A vacina {vacina} do {pet} está próxima do vencimento em {data}. Agende a revacinação!',
  ALTER COLUMN "emailFromName"
    SET DEFAULT 'Eumaeus Clínica Veterinária',
  ALTER COLUMN "clinicName"
    SET DEFAULT 'Eumaeus Clínica Veterinária',
  ALTER COLUMN "clinicAddress"
    SET DEFAULT 'Rua das Flores, 123 - São Paulo, SP';

-- Align the legacy initializer with Prisma's implicit many-to-many layout.
ALTER TABLE "public"."_PermissionToRole"
  DROP CONSTRAINT IF EXISTS "_PermissionToRole_AB_pkey";

CREATE UNIQUE INDEX IF NOT EXISTS "_PermissionToRole_AB_unique"
  ON "public"."_PermissionToRole"("A", "B");

COMMIT;
