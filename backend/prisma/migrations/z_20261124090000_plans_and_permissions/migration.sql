-- Plano do estabelecimento e permissões por funcionário.
ALTER TABLE "ClinicSettings" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'CLINICA_PETSHOP';
ALTER TABLE "ClinicSettings" ADD COLUMN IF NOT EXISTS "separateUnits" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permissions" JSONB;
INSERT INTO "Role" ("name", "description") VALUES ('BANHO_TOSA', 'Agenda de banho e tosa, estoque e caixa.') ON CONFLICT ("name") DO NOTHING;
