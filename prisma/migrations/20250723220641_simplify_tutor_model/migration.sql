/*
  Warnings:

  - You are about to drop the column `authProfileId` on the `Tutor` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tutor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "clinicId" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" DATETIME
);
INSERT INTO "new_Tutor" ("address", "clinicId", "createdAt", "deletedAt", "email", "id", "name", "phone", "updatedAt") SELECT "address", "clinicId", "createdAt", "deletedAt", "email", "id", "name", "phone", "updatedAt" FROM "Tutor";
DROP TABLE "Tutor";
ALTER TABLE "new_Tutor" RENAME TO "Tutor";
CREATE UNIQUE INDEX "Tutor_email_key" ON "Tutor"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
