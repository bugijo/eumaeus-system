CREATE TABLE "ProductLot" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "lotCode" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "quantity" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductLot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "StockMovement" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clinicId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "lotId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "appointmentId" INTEGER,
  "authorizedByUserId" INTEGER,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockMovement_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ProductLot"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProductLot_clinicId_productId_lotCode_key" ON "ProductLot"("clinicId", "productId", "lotCode");
CREATE INDEX "ProductLot_clinicId_expiresAt_idx" ON "ProductLot"("clinicId", "expiresAt");
CREATE INDEX "StockMovement_clinicId_productId_createdAt_idx" ON "StockMovement"("clinicId", "productId", "createdAt");
CREATE INDEX "StockMovement_clinicId_appointmentId_idx" ON "StockMovement"("clinicId", "appointmentId");
