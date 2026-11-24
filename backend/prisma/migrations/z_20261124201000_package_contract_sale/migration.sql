-- Compra de pacote passa a ser registrada como venda no caixa; o contrato aponta para a venda.
ALTER TABLE "PackageContract" ADD COLUMN "saleId" INTEGER;
CREATE UNIQUE INDEX "PackageContract_saleId_key" ON "PackageContract"("saleId");
ALTER TABLE "PackageContract" ADD CONSTRAINT "PackageContract_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
