#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const container = process.env.EUMAEUS_LOCAL_PG_CONTAINER || 'eumaeus-postgres-local';
const database = 'eumaeus_local';
const dbUser = 'eumaeus';
const clinicId = 9201;
const marker = `pg-concurrency-${Date.now()}-${randomBytes(4).toString('hex')}`;

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const docker = (args, input) => new Promise((resolve, reject) => {
  const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.once('error', reject);
  child.once('close', (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
  if (input) child.stdin.end(input); else child.stdin.end();
});
const run = async (sqlText) => {
  const result = await docker(['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', dbUser, '-d', database, '-At', '-F', '\t'], sqlText);
  if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'psql failed');
  return result.stdout;
};
const scalar = async (sqlText) => {
  const value = (await run(sqlText)).split('\n').filter(Boolean).at(-1);
  if (value === undefined) throw new Error(`Consulta sem resultado: ${sqlText}`);
  return value;
};
const assert = (condition, message) => {
  if (!condition) throw new Error(`PROVA FALHOU: ${message}`);
};
const concurrent = async (sqlA, sqlB) => Promise.all([docker(['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', dbUser, '-d', database, '-At'], sqlA), docker(['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', dbUser, '-d', database, '-At'], sqlB)]);

async function assertLocalContainer() {
  const inspected = JSON.parse((await docker(['inspect', container])).stdout)[0];
  assert(inspected?.State?.Running === true, `container ${container} não está ativo`);
  assert(/^postgres(?::|$)/i.test(inspected?.Config?.Image || ''), 'alvo não é PostgreSQL');
  assert(inspected?.Config?.Env?.some((item) => item === 'POSTGRES_DB=eumaeus_local'), 'banco local não confirmado');
}

async function createFixtures() {
  await run(`
BEGIN;
INSERT INTO "Tutor" ("name", "email", "phone", "clinicId", "updatedAt") VALUES (${quote(`${marker}-tutor`)}, ${quote(`${marker}@example.invalid`)}, '00000000000', ${clinicId}, CURRENT_TIMESTAMP);
INSERT INTO "Pet" ("name", "species", "breed", "tutorId", "clinicId", "updatedAt") SELECT ${quote(`${marker}-pet`)}, 'TESTE', 'SINTETICO', id, ${clinicId}, CURRENT_TIMESTAMP FROM "Tutor" WHERE "email" = ${quote(`${marker}@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '09:00', ${quote(marker)}, p.id, t.id, ${clinicId}, CURRENT_TIMESTAMP FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t."email" = ${quote(`${marker}@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '10:00', ${quote(`${marker}-package-a`)}, p.id, t.id, ${clinicId}, CURRENT_TIMESTAMP FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t."email" = ${quote(`${marker}@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '11:00', ${quote(`${marker}-package-b`)}, p.id, t.id, ${clinicId}, CURRENT_TIMESTAMP FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t."email" = ${quote(`${marker}@example.invalid`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId") SELECT 5.00, ${clinicId}, id FROM "Appointment" WHERE notes = ${quote(marker)};
INSERT INTO "CatalogService" ("clinicId", "name", "price", "durationMinutes", "category", "updatedAt") VALUES (${clinicId}, ${quote(`${marker}-catalog`)}, 5.00, 30, 'TESTE', CURRENT_TIMESTAMP);
INSERT INTO "ServicePackage" ("clinicId", "name", "price", "totalSessions", "validityDays", "coveredCatalogServiceId", "updatedAt") SELECT ${clinicId}, ${quote(`${marker}-package`)}, 10.00, 1, 30, id, CURRENT_TIMESTAMP FROM "CatalogService" WHERE name = ${quote(`${marker}-catalog`)};
INSERT INTO "PackageContract" ("clinicId", "packageId", "tutorId", "petId", "contractedPrice", "totalSessions", "remainingSessions", "expiresAt", "updatedAt")
SELECT ${clinicId}, sp.id, t.id, p.id, 10.00, 1, 1, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP FROM "ServicePackage" sp JOIN "Tutor" t ON t."email" = ${quote(`${marker}@example.invalid`)} JOIN "Pet" p ON p."tutorId" = t.id WHERE sp.name = ${quote(`${marker}-package`)};
INSERT INTO "Service" ("name", "price", "clinicId", "catalogServiceId", "appointmentId")
SELECT ${quote(`${marker}-service-a`)}, 5.00, ${clinicId}, cs.id, a.id FROM "CatalogService" cs JOIN "Appointment" a ON a.notes = ${quote(`${marker}-package-a`)} WHERE cs.name = ${quote(`${marker}-catalog`)};
INSERT INTO "Service" ("name", "price", "clinicId", "catalogServiceId", "appointmentId")
SELECT ${quote(`${marker}-service-b`)}, 5.00, ${clinicId}, cs.id, a.id FROM "CatalogService" cs JOIN "Appointment" a ON a.notes = ${quote(`${marker}-package-b`)} WHERE cs.name = ${quote(`${marker}-catalog`)};
INSERT INTO "Product" ("name", "price", "quantity", "clinicId", "updatedAt") VALUES (${quote(`${marker}-product`)}, 1.00, 1, ${clinicId}, CURRENT_TIMESTAMP);
INSERT INTO "ProductLot" ("clinicId", "productId", "lotCode", "quantity") SELECT ${clinicId}, id, ${quote(`${marker}-lot`)}, 1 FROM "Product" WHERE name = ${quote(`${marker}-product`)};
COMMIT;`);
}

async function ids() {
  return {
    invoice: await scalar(`SELECT id FROM "Invoice" WHERE "clinicId" = ${clinicId} AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes = ${quote(marker)});`),
    contract: await scalar(`SELECT id FROM "PackageContract" WHERE "clinicId" = ${clinicId} AND "tutorId" IN (SELECT id FROM "Tutor" WHERE email = ${quote(`${marker}@example.invalid`)});`),
    appointmentA: await scalar(`SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-package-a`)};`),
    appointmentB: await scalar(`SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-package-b`)};`),
    serviceA: await scalar(`SELECT id FROM "Service" WHERE name = ${quote(`${marker}-service-a`)};`),
    serviceB: await scalar(`SELECT id FROM "Service" WHERE name = ${quote(`${marker}-service-b`)};`),
    product: await scalar(`SELECT id FROM "Product" WHERE name = ${quote(`${marker}-product`)};`),
    lot: await scalar(`SELECT id FROM "ProductLot" WHERE "lotCode" = ${quote(`${marker}-lot`)};`),
  };
}

function paymentSql(invoice, key, sleep = true) {
  return `BEGIN;
SELECT id FROM "Invoice" WHERE id = ${invoice} FOR UPDATE;
SELECT pg_sleep(${sleep ? '0.6' : '0'});
INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey")
SELECT ${clinicId}, ${invoice}, 5.00, 'TEST', ${quote(key)}
WHERE (SELECT COALESCE(sum("amount"), 0) FROM "Payment" WHERE "invoiceId" = ${invoice} AND status = 'POSTED') + 5.00 <= (SELECT "totalAmount" FROM "Invoice" WHERE id = ${invoice});
UPDATE "Invoice" SET status = CASE WHEN (SELECT COALESCE(sum("amount"), 0) FROM "Payment" WHERE "invoiceId" = ${invoice} AND status = 'POSTED') >= "totalAmount" THEN 'PAID' ELSE 'PENDING' END WHERE id = ${invoice};
COMMIT;`;
}

async function payments(fixture) {
  const sameBalance = await concurrent(paymentSql(fixture.invoice, `${marker}-pay-a`), paymentSql(fixture.invoice, `${marker}-pay-b`));
  const posted = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${fixture.invoice} AND "idempotencyKey" LIKE ${quote(`${marker}-pay-%`)};`);
  const total = await scalar(`SELECT COALESCE(sum("amount"), 0) FROM "Payment" WHERE "invoiceId" = ${fixture.invoice} AND "idempotencyKey" LIKE ${quote(`${marker}-pay-%`)};`);
  await run(`DELETE FROM "Payment" WHERE "invoiceId" = ${fixture.invoice}; UPDATE "Invoice" SET status = 'PENDING' WHERE id = ${fixture.invoice};`);
  const sameKey = await concurrent(paymentSql(fixture.invoice, `${marker}-same-key`, false), paymentSql(fixture.invoice, `${marker}-same-key`, false));
  const sameKeyCount = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${fixture.invoice} AND "idempotencyKey" = ${quote(`${marker}-same-key`)};`);
  return {
    simultaneousReceipts: { exitCodes: sameBalance.map((r) => r.code), posted, total, expected: '1 payment / 5.00', passed: posted === '1' && total === '5.00' },
    sameIdempotencyKey: { exitCodes: sameKey.map((r) => r.code), committedRows: sameKeyCount, expected: '1 payment', passed: sameKeyCount === '1' },
    equalInstallments: await equalInstallments(fixture.invoice),
  };
}

async function equalInstallments(invoice) {
  await run(`DELETE FROM "Payment" WHERE "invoiceId" = ${invoice};`);
  const result = await concurrent(`BEGIN; INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey") VALUES (${clinicId}, ${invoice}, 2.50, 'TEST', ${quote(`${marker}-installment-a`)}); COMMIT;`, `BEGIN; INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey") VALUES (${clinicId}, ${invoice}, 2.50, 'TEST', ${quote(`${marker}-installment-b`)}); COMMIT;`);
  const count = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${invoice} AND "idempotencyKey" LIKE ${quote(`${marker}-installment-%`)};`);
  return { exitCodes: result.map((r) => r.code), committedRows: count, expected: '2 payments / 5.00', passed: count === '2' };
}

async function packageConsumption(fixture) {
  const sessionSql = (appointment, service) => `BEGIN;
SELECT pg_sleep(0.2);
WITH changed AS (
  UPDATE "PackageContract" SET "remainingSessions" = "remainingSessions" - 1
  WHERE id = ${fixture.contract} AND "remainingSessions" > 0
  RETURNING id
)
INSERT INTO "PackageSession" ("clinicId", "contractId", "appointmentId", "serviceId")
SELECT ${clinicId}, ${fixture.contract}, ${appointment}, ${service} FROM changed;
COMMIT;`;
  const result = await concurrent(sessionSql(fixture.appointmentA, fixture.serviceA), sessionSql(fixture.appointmentB, fixture.serviceB));
  const sessions = await scalar(`SELECT count(*) FROM "PackageSession" WHERE "contractId" = ${fixture.contract};`);
  const remaining = await scalar(`SELECT "remainingSessions" FROM "PackageContract" WHERE id = ${fixture.contract};`);
  return { exitCodes: result.map((r) => r.code), sessions, remaining, expected: '1 session / 0 remaining', passed: sessions === '1' && remaining === '0' };
}

async function stock(fixture) {
  const issueSql = (key) => `BEGIN;
SELECT pg_sleep(0.2);
WITH changed_lot AS (
  UPDATE "ProductLot" SET quantity = quantity - 1 WHERE id = ${fixture.lot} AND quantity >= 1 RETURNING id
), changed_product AS (
  UPDATE "Product" SET quantity = quantity - 1 WHERE id = ${fixture.product} AND quantity >= 1 AND EXISTS (SELECT 1 FROM changed_lot) RETURNING id
)
INSERT INTO "StockMovement" ("clinicId", "productId", "lotId", "type", "quantity", "reason", "idempotencyKey")
SELECT ${clinicId}, ${fixture.product}, ${fixture.lot}, 'ISSUE', 1, ${quote(marker)}, ${quote(key)} FROM changed_lot JOIN changed_product ON true;
COMMIT;`;
  const result = await concurrent(issueSql(`${marker}-stock-a`), issueSql(`${marker}-stock-b`));
  const lot = await scalar(`SELECT quantity FROM "ProductLot" WHERE id = ${fixture.lot};`);
  const movements = await scalar(`SELECT count(*) FROM "StockMovement" WHERE "lotId" = ${fixture.lot} AND reason = ${quote(marker)};`);
  return { exitCodes: result.map((r) => r.code), lotQuantity: lot, movements, expected: '0 quantity / 1 movement', passed: lot === '0' && movements === '1' };
}

async function reversals(fixture) {
  await run(`INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey") VALUES (${clinicId}, ${fixture.invoice}, 1.00, 'TEST', ${quote(`${marker}-reversal`)});`);
  const payment = await scalar(`SELECT id FROM "Payment" WHERE "idempotencyKey" = ${quote(`${marker}-reversal`)};`);
  const sql = `BEGIN ISOLATION LEVEL SERIALIZABLE; UPDATE "Payment" SET status = 'REVERSED', "reversedAt" = CURRENT_TIMESTAMP, "reversalReason" = 'concorrência sintética' WHERE id = ${payment} AND status = 'POSTED'; SELECT pg_sleep(0.3); COMMIT;`;
  const result = await concurrent(sql, sql);
  const count = await scalar(`SELECT count(*) FROM "Payment" WHERE id = ${payment} AND status = 'REVERSED';`);
  return { exitCodes: result.map((r) => r.code), reversedRows: count, expected: 'one logical reversal', passed: count === '1' };
}

async function cleanup() {
  await run(`BEGIN;
DELETE FROM "PackageSession" WHERE "contractId" IN (SELECT id FROM "PackageContract" WHERE "clinicId" = ${clinicId});
DELETE FROM "Payment" WHERE "clinicId" = ${clinicId};
DELETE FROM "StockMovement" WHERE "clinicId" = ${clinicId};
DELETE FROM "ProductLot" WHERE "clinicId" = ${clinicId};
DELETE FROM "Product" WHERE "clinicId" = ${clinicId};
DELETE FROM "PackageContract" WHERE "clinicId" = ${clinicId};
DELETE FROM "Service" WHERE "clinicId" = ${clinicId};
DELETE FROM "ServicePackage" WHERE "clinicId" = ${clinicId};
DELETE FROM "CatalogService" WHERE "clinicId" = ${clinicId};
DELETE FROM "Invoice" WHERE "clinicId" = ${clinicId};
DELETE FROM "Appointment" WHERE "clinicId" = ${clinicId};
DELETE FROM "Pet" WHERE "clinicId" = ${clinicId};
DELETE FROM "Tutor" WHERE "clinicId" = ${clinicId};
COMMIT;`);
}

await assertLocalContainer();
let created = false;
try {
  await createFixtures();
  created = true;
  const fixture = await ids();
  const report = {
    ok: true,
    marker,
    container,
    database,
    clinicId,
    independentConnections: true,
    scenarios: {
      payments: await payments(fixture),
      packageLastSession: await packageConsumption(fixture),
      stockInsufficient: await stock(fixture),
      concurrentReversals: await reversals(fixture),
    },
  };
  report.ok = Object.values(report.scenarios).every((scenario) => scenario.passed !== false)
    && report.scenarios.payments.simultaneousReceipts.passed
    && report.scenarios.payments.sameIdempotencyKey.passed
    && report.scenarios.payments.equalInstallments.passed;
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 2;
} finally {
  if (created) await cleanup();
}
