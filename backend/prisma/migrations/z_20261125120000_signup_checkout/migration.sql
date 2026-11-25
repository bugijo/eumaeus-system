-- Confirmação de e-mail: contas existentes ficam confirmadas (o DEFAULT preenche as linhas atuais).
ALTER TABLE "AuthProfile" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AuthProfile" ADD COLUMN "emailVerificationTokenHash" TEXT;
ALTER TABLE "AuthProfile" ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "AuthProfile_emailVerificationTokenHash_key" ON "AuthProfile"("emailVerificationTokenHash");

-- Estabelecimentos: registra os clinicId já em uso e segue a numeração a partir do maior.
CREATE TABLE "Clinic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Clinic" ("id", "name")
SELECT ids."clinicId", COALESCE(cs."clinicName", 'Estabelecimento ' || ids."clinicId")
FROM (
    SELECT "clinicId" FROM "User"
    UNION SELECT "clinicId" FROM "Tutor"
    UNION SELECT "clinicId" FROM "ClinicSettings"
) ids
LEFT JOIN "ClinicSettings" cs ON cs."clinicId" = ids."clinicId"
WHERE ids."clinicId" IS NOT NULL;

SELECT setval(pg_get_serial_sequence('"Clinic"', 'id'), COALESCE((SELECT MAX("id") FROM "Clinic"), 0) + 1, false);

CREATE TABLE "SignupCheckout" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "browserTokenHash" TEXT NOT NULL,
    "emailTokenHash" TEXT,
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "mpPaymentStatus" TEXT,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "clinicId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignupCheckout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignupCheckout_browserTokenHash_key" ON "SignupCheckout"("browserTokenHash");
CREATE UNIQUE INDEX "SignupCheckout_emailTokenHash_key" ON "SignupCheckout"("emailTokenHash");
CREATE UNIQUE INDEX "SignupCheckout_mpPreferenceId_key" ON "SignupCheckout"("mpPreferenceId");
CREATE UNIQUE INDEX "SignupCheckout_mpPaymentId_key" ON "SignupCheckout"("mpPaymentId");
CREATE INDEX "SignupCheckout_status_createdAt_idx" ON "SignupCheckout"("status", "createdAt");

ALTER TABLE "SignupCheckout" ADD CONSTRAINT "SignupCheckout_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
