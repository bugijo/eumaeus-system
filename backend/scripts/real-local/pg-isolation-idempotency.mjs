#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const container = process.env.EUMAEUS_LOCAL_PG_CONTAINER || 'eumaeus-postgres-local';
const database = 'eumaeus_local';
const dbUser = 'eumaeus';
const clinicA = 9101;
const clinicB = 9102;
const marker = `pg-proof-${Date.now()}-${randomBytes(4).toString('hex')}`;
const paymentKey = `payment-${marker}`;
const stockKey = `stock-${marker}`;
const dedupeKey = `outbox-${marker}`;

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const run = (args) => {
  const result = spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'docker command failed').trim());
  return result.stdout.trim();
};
const sql = (statement) => run(['exec', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', dbUser, '-d', database, '-At', '-F', '\t', '-c', statement]);
const scalar = (statement) => {
  const value = sql(statement).split('\n').filter(Boolean).at(-1);
  if (value === undefined) throw new Error(`Consulta sem resultado: ${statement}`);
  return value;
};
const assert = (condition, message) => {
  if (!condition) throw new Error(`PROVA FALHOU: ${message}`);
};
const expectSqlFailure = (statement, message) => {
  let failed = false;
  try {
    sql(statement);
  } catch {
    failed = true;
  }
  assert(failed, message);
};

function assertLocalContainer() {
  const inspected = JSON.parse(run(['inspect', container]))[0];
  const image = inspected?.Config?.Image || '';
  const running = inspected?.State?.Running === true;
  assert(running, `container ${container} não está ativo`);
  assert(/^postgres(?::|$)/i.test(image), `alvo não é imagem PostgreSQL: ${image}`);
  assert(inspected?.Config?.Env?.some((item) => item === 'POSTGRES_DB=eumaeus_local'), 'banco local esperado não confirmado');
}

function createFixtures() {
  sql(`
BEGIN;
INSERT INTO "Role" ("name", "description") VALUES ('FINANCEIRO', 'fixture local') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "AuthProfile" ("email", "password") VALUES
  (${quote(`${marker}.a@example.invalid`)}, 'fixture-password-not-for-login'),
  (${quote(`${marker}.b@example.invalid`)}, 'fixture-password-not-for-login');
INSERT INTO "User" ("name", "clinicId", "roleName", "authProfileId", "createdAt", "updatedAt")
SELECT ${quote(`${marker}-user-a`)}, ${clinicA}, 'FINANCEIRO', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "AuthProfile" WHERE email = ${quote(`${marker}.a@example.invalid`)};
INSERT INTO "User" ("name", "clinicId", "roleName", "authProfileId", "createdAt", "updatedAt")
SELECT ${quote(`${marker}-user-b`)}, ${clinicB}, 'FINANCEIRO', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "AuthProfile" WHERE email = ${quote(`${marker}.b@example.invalid`)};
INSERT INTO "Tutor" ("name", "email", "phone", "clinicId", "createdAt", "updatedAt") VALUES
  (${quote(`${marker}-tutor-a`)}, ${quote(`${marker}.tutor-a@example.invalid`)}, '00000000000', ${clinicA}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (${quote(`${marker}-tutor-b`)}, ${quote(`${marker}.tutor-b@example.invalid`)}, '00000000000', ${clinicB}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "Pet" ("name", "species", "breed", "tutorId", "clinicId", "createdAt", "updatedAt")
SELECT ${quote(`${marker}-pet-a`)}, 'TESTE', 'SINTETICO', id, ${clinicA}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Pet" ("name", "species", "breed", "tutorId", "clinicId", "createdAt", "updatedAt")
SELECT ${quote(`${marker}-pet-b`)}, 'TESTE', 'SINTETICO', id, ${clinicB}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}.tutor-b@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "createdAt", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '09:00', ${quote(marker)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "createdAt", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '10:00', ${quote(marker)}, p.id, t.id, ${clinicB}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-b@example.invalid`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId")
SELECT 5.00, ${clinicA}, id FROM "Appointment" WHERE notes = ${quote(marker)} AND "clinicId" = ${clinicA};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId")
SELECT 5.00, ${clinicB}, id FROM "Appointment" WHERE notes = ${quote(marker)} AND "clinicId" = ${clinicB};
INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey", "receivedByUserId")
SELECT ${clinicA}, i.id, 5.00, 'TEST', ${quote(paymentKey)}, u.id FROM "Invoice" i
JOIN "User" u ON u."clinicId" = ${clinicA} AND u.name = ${quote(`${marker}-user-a`)} WHERE i."clinicId" = ${clinicA};
INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey", "receivedByUserId")
SELECT ${clinicB}, i.id, 5.00, 'TEST', ${quote(paymentKey)}, u.id FROM "Invoice" i
JOIN "User" u ON u."clinicId" = ${clinicB} AND u.name = ${quote(`${marker}-user-b`)} WHERE i."clinicId" = ${clinicB};
INSERT INTO "FinancialAuditEvent" ("clinicId", "eventType", "paymentId", "actorUserId", "metadata")
SELECT p."clinicId", 'PAYMENT_RECEIVED_FIXTURE', p.id, p."receivedByUserId", jsonb_build_object('marker', ${quote(marker)}) FROM "Payment" p WHERE p."idempotencyKey" = ${quote(paymentKey)};
INSERT INTO "Product" ("name", "price", "clinicId", "createdAt", "updatedAt") VALUES
  (${quote(`${marker}-product-a`)}, 1.00, ${clinicA}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (${quote(`${marker}-product-b`)}, 1.00, ${clinicB}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "ProductLot" ("clinicId", "productId", "lotCode")
SELECT ${clinicA}, id, ${quote(`${marker}-lot-a`)} FROM "Product" WHERE name = ${quote(`${marker}-product-a`)};
INSERT INTO "ProductLot" ("clinicId", "productId", "lotCode")
SELECT ${clinicB}, id, ${quote(`${marker}-lot-b`)} FROM "Product" WHERE name = ${quote(`${marker}-product-b`)};
INSERT INTO "StockMovement" ("clinicId", "productId", "lotId", "type", "quantity", "reason", "idempotencyKey")
SELECT ${clinicA}, p.id, l.id, 'RECEIPT', 1, ${quote(marker)}, ${quote(stockKey)} FROM "Product" p JOIN "ProductLot" l ON l."productId" = p.id WHERE p.name = ${quote(`${marker}-product-a`)};
INSERT INTO "StockMovement" ("clinicId", "productId", "lotId", "type", "quantity", "reason", "idempotencyKey")
SELECT ${clinicB}, p.id, l.id, 'RECEIPT', 1, ${quote(marker)}, ${quote(stockKey)} FROM "Product" p JOIN "ProductLot" l ON l."productId" = p.id WHERE p.name = ${quote(`${marker}-product-b`)};
INSERT INTO "CommunicationOutbox" ("clinicId", "tutorId", "eventType", "category", "dedupeKey", "payload", "createdAt", "updatedAt")
SELECT ${clinicA}, id, 'FIXTURE', 'BASIC', ${quote(dedupeKey)}, jsonb_build_object('marker', ${quote(marker)}), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "CommunicationOutbox" ("clinicId", "tutorId", "eventType", "category", "dedupeKey", "payload", "createdAt", "updatedAt")
SELECT ${clinicB}, id, 'FIXTURE', 'BASIC', ${quote(dedupeKey)}, jsonb_build_object('marker', ${quote(marker)}), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}.tutor-b@example.invalid`)};
COMMIT;`);
}

function verifyIsolationAndIdempotency() {
  for (const table of ['Payment', 'StockMovement', 'CommunicationOutbox']) {
    const column = table === 'CommunicationOutbox' ? 'dedupeKey' : 'idempotencyKey';
    const key = table === 'Payment' ? paymentKey : table === 'StockMovement' ? stockKey : dedupeKey;
    assert(scalar(`SELECT count(*) FROM "${table}" WHERE "${column}" = ${quote(key)};`) === '2', `${table}: chave não existe uma vez por clínica`);
    assert(scalar(`SELECT count(*) FROM "${table}" WHERE "clinicId" = ${clinicA} AND "${column}" = ${quote(key)};`) === '1', `${table}: clínica A não isolada`);
    assert(scalar(`SELECT count(*) FROM "${table}" WHERE "clinicId" = ${clinicB} AND "${column}" = ${quote(key)};`) === '1', `${table}: clínica B não isolada`);
  }
  expectSqlFailure(`INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey", "receivedByUserId")
SELECT "clinicId", "invoiceId", 5.00, "method", "idempotencyKey", "receivedByUserId" FROM "Payment" WHERE "clinicId" = ${clinicA} AND "idempotencyKey" = ${quote(paymentKey)};`, 'Payment: duplicação na mesma clínica foi aceita');
  expectSqlFailure(`INSERT INTO "StockMovement" ("clinicId", "productId", "lotId", "type", "quantity", "reason", "idempotencyKey")
SELECT "clinicId", "productId", "lotId", "type", 1, "reason", "idempotencyKey" FROM "StockMovement" WHERE "clinicId" = ${clinicA} AND "idempotencyKey" = ${quote(stockKey)};`, 'StockMovement: duplicação na mesma clínica foi aceita');
  expectSqlFailure(`INSERT INTO "CommunicationOutbox" ("clinicId", "tutorId", "eventType", "category", "dedupeKey", "payload", "createdAt", "updatedAt")
SELECT "clinicId", "tutorId", "eventType", "category", "dedupeKey", "payload", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "CommunicationOutbox" WHERE "clinicId" = ${clinicA} AND "dedupeKey" = ${quote(dedupeKey)};`, 'CommunicationOutbox: duplicação na mesma clínica foi aceita');
  const invoiceB = `(SELECT id FROM "Invoice" WHERE "clinicId" = ${clinicB} AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes = ${quote(marker)}))`;
  assert(scalar(`SELECT count(*) FROM "Payment" WHERE "clinicId" = ${clinicA} AND "invoiceId" = ${invoiceB};`) === '0', 'pagamento de B apareceu no escopo de A');
  assert(scalar(`SELECT count(*) FROM "StockMovement" WHERE "clinicId" = ${clinicA} AND "productId" IN (SELECT id FROM "Product" WHERE "clinicId" = ${clinicB} AND name LIKE ${quote(`${marker}%`)});`) === '0', 'estoque de B apareceu no escopo de A');
}

function verifyAuditRollback() {
  const rollbackKey = `rollback-${marker}`;
  let failed = false;
  try {
    sql(`BEGIN;
INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey")
SELECT ${clinicA}, id, 1.00, 'TEST', ${quote(rollbackKey)} FROM "Invoice" WHERE "clinicId" = ${clinicA} LIMIT 1;
INSERT INTO "FinancialAuditEvent" ("clinicId", "eventType", "paymentId", "actorUserId")
SELECT ${clinicA}, 'PAYMENT_RECEIVED_ROLLBACK_FIXTURE', id, 999999999 FROM "Payment" WHERE "idempotencyKey" = ${quote(rollbackKey)};
COMMIT;`);
  } catch {
    failed = true;
  }
  assert(failed, 'auditoria inválida não causou rollback');
  assert(scalar(`SELECT count(*) FROM "Payment" WHERE "idempotencyKey" = ${quote(rollbackKey)};`) === '0', 'pagamento sobreviveu ao rollback da auditoria');
}

function cleanup() {
  sql(`BEGIN;
DELETE FROM "FinancialAuditEvent" WHERE "paymentId" IN (SELECT id FROM "Payment" WHERE "idempotencyKey" IN (${quote(paymentKey)})) OR metadata::text LIKE ${quote(`%${marker}%`)};
DELETE FROM "Payment" WHERE "idempotencyKey" IN (${quote(paymentKey)}, ${quote(`rollback-${marker}`)});
DELETE FROM "CommunicationOutbox" WHERE "dedupeKey" = ${quote(dedupeKey)};
DELETE FROM "StockMovement" WHERE "reason" = ${quote(marker)};
DELETE FROM "ProductLot" WHERE "lotCode" LIKE ${quote(`${marker}%`)};
DELETE FROM "Product" WHERE "name" LIKE ${quote(`${marker}%`)};
DELETE FROM "Invoice" WHERE "clinicId" IN (${clinicA}, ${clinicB}) AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes = ${quote(marker)});
DELETE FROM "Appointment" WHERE notes = ${quote(marker)};
DELETE FROM "Pet" WHERE name LIKE ${quote(`${marker}%`)};
DELETE FROM "Tutor" WHERE email LIKE ${quote(`${marker}.%`)};
DELETE FROM "User" WHERE name LIKE ${quote(`${marker}%`)};
DELETE FROM "AuthProfile" WHERE email LIKE ${quote(`${marker}.%`)};
COMMIT;`);
  assert(scalar(`SELECT count(*) FROM "Tutor" WHERE email LIKE ${quote(`${marker}.%`)};`) === '0', 'fixtures de tutor não foram limpos');
  assert(scalar(`SELECT count(*) FROM "Payment" WHERE "idempotencyKey" LIKE ${quote(`%${marker}%`)};`) === '0', 'fixtures de pagamento não foram limpos');
}

assertLocalContainer();
let created = false;
try {
  createFixtures();
  created = true;
  verifyIsolationAndIdempotency();
  verifyAuditRollback();
  console.log(JSON.stringify({ ok: true, database, container, clinics: [clinicA, clinicB], proof: ['tenant-scoped keys', 'cross-clinic read exclusion', 'audit rollback'] }));
} finally {
  if (created) cleanup();
}
