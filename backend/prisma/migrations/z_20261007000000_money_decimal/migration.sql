-- Lote 1: remove precisão binária dos valores monetários.
-- A conversão preserva os valores existentes arredondando para centavos;
-- esta migração deve ser aplicada primeiro em homologação e verificada por amostragem.
ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DECIMAL(12, 2)
  USING ROUND("price"::numeric, 2);

ALTER TABLE "Service"
  ALTER COLUMN "price" TYPE DECIMAL(12, 2)
  USING ROUND("price"::numeric, 2);

ALTER TABLE "Invoice"
  ALTER COLUMN "totalAmount" TYPE DECIMAL(12, 2)
  USING ROUND("totalAmount"::numeric, 2);

ALTER TABLE "InvoiceItem"
  ALTER COLUMN "unitPrice" TYPE DECIMAL(12, 2)
  USING ROUND("unitPrice"::numeric, 2);

ALTER TABLE "InvoiceItem"
  ALTER COLUMN "totalPrice" TYPE DECIMAL(12, 2)
  USING ROUND("totalPrice"::numeric, 2);
