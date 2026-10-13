#!/usr/bin/env node

/**
 * HTTP integration proof against the local PostgreSQL-backed server.
 *
 * This script deliberately does not import Express services or use mocks. It
 * creates two synthetic clinics, logs in through /api/auth/login, and drives
 * concurrent requests through the public HTTP routes. The generated password
 * is held only in memory and is never printed.
 *
 * Required local setup:
 *   1. eumaeus-postgres-local must be running with eumaeus_local.
 *   2. The backend must be running with the same DATABASE_URL and
 *      EUMAEUS_HTTP_BASE_URL (default http://127.0.0.1:3334).
 *
 * Example:
 *   DATABASE_URL='postgresql://eumaeus:eumaeus_local_only@127.0.0.1:55432/eumaeus_local' \
 *   JWT_SECRET='local-http-proof-secret' \
 *   REFRESH_TOKEN_SECRET='local-http-proof-refresh' \
 *   NODE_ENV=test PORT=3334 node backend/dist/src/bootstrap.js
 *   node backend/scripts/real-local/http-concurrency-authenticated.mjs
 */

import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import bcrypt from 'bcrypt';

const container = process.env.EUMAEUS_LOCAL_PG_CONTAINER || 'eumaeus-postgres-local';
const database = 'eumaeus_local';
const dbUser = 'eumaeus';
const baseUrl = (process.env.EUMAEUS_HTTP_BASE_URL || 'http://127.0.0.1:3334').replace(/\/$/, '');
const marker = `http-proof-${Date.now()}-${randomBytes(5).toString('hex')}`;
const clinicA = 76000 + Number(randomBytes(2).readUInt16BE(0) % 900);
const clinicB = clinicA + 1;
const password = randomBytes(24).toString('base64url');
const emailA = `${marker}.a@example.invalid`;
const emailAVet = `${marker}.a-vet@example.invalid`;
const emailB = `${marker}.b@example.invalid`;

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const assert = (condition, message) => {
  if (!condition) throw new Error(`PROVA FALHOU: ${message}`);
};

const docker = (args, input = '') => new Promise((resolve, reject) => {
  const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.once('error', reject);
  child.once('close', (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
  child.stdin.end(input);
});

const runSql = async (statement) => {
  const result = await docker([
    'exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1',
    '-U', dbUser, '-d', database, '-At', '-F', '\t',
  ], statement);
  if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'psql failed');
  return result.stdout;
};

const scalar = async (statement) => {
  const value = (await runSql(statement)).split('\n').filter(Boolean).at(-1);
  if (value === undefined) throw new Error(`Consulta sem resultado: ${statement}`);
  return value;
};

const json = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
};

const authenticated = (token, path, body, method = 'POST') => json(path, {
  method,
  headers: { authorization: `Bearer ${token}` },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const concurrent = (calls) => Promise.all(calls);

async function assertLocalContainer() {
  const inspected = JSON.parse((await docker(['inspect', container])).stdout)[0];
  assert(inspected?.State?.Running === true, `container ${container} não está ativo`);
  assert(/^postgres(?::|$)/i.test(inspected?.Config?.Image || ''), 'alvo não é PostgreSQL');
  assert(inspected?.Config?.Env?.some((item) => item === 'POSTGRES_DB=eumaeus_local'), 'banco local não confirmado');
}

async function createFixtures() {
  const passwordHash = await bcrypt.hash(password, 10);
  await runSql(`
BEGIN;
INSERT INTO "Role" ("name", "description") VALUES ('FINANCEIRO', 'fixture HTTP local'), ('VETERINARIO', 'fixture HTTP local') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "AuthProfile" ("email", "password") VALUES (${quote(emailA)}, ${quote(passwordHash)}), (${quote(emailAVet)}, ${quote(passwordHash)}), (${quote(emailB)}, ${quote(passwordHash)});
INSERT INTO "User" ("name", "clinicId", "roleName", "authProfileId", "updatedAt")
SELECT ${quote(`${marker}-user-a`)}, ${clinicA}, 'FINANCEIRO', id, CURRENT_TIMESTAMP FROM "AuthProfile" WHERE email = ${quote(emailA)};
INSERT INTO "User" ("name", "clinicId", "roleName", "authProfileId", "updatedAt")
SELECT ${quote(`${marker}-user-a-vet`)}, ${clinicA}, 'VETERINARIO', id, CURRENT_TIMESTAMP FROM "AuthProfile" WHERE email = ${quote(emailAVet)};
INSERT INTO "User" ("name", "clinicId", "roleName", "authProfileId", "updatedAt")
SELECT ${quote(`${marker}-user-b`)}, ${clinicB}, 'VETERINARIO', id, CURRENT_TIMESTAMP FROM "AuthProfile" WHERE email = ${quote(emailB)};
INSERT INTO "Tutor" ("name", "email", "phone", "clinicId", "updatedAt") VALUES
  (${quote(`${marker}-tutor-a`)}, ${quote(`${marker}.tutor-a@example.invalid`)}, '00000000000', ${clinicA}, CURRENT_TIMESTAMP),
  (${quote(`${marker}-tutor-b`)}, ${quote(`${marker}.tutor-b@example.invalid`)}, '00000000001', ${clinicB}, CURRENT_TIMESTAMP);
INSERT INTO "Pet" ("name", "species", "breed", "tutorId", "clinicId", "updatedAt")
SELECT ${quote(`${marker}-pet-a`)}, 'TESTE', 'SINTETICO', id, ${clinicA}, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Pet" ("name", "species", "breed", "tutorId", "clinicId", "updatedAt")
SELECT ${quote(`${marker}-pet-b`)}, 'TESTE', 'SINTETICO', id, ${clinicB}, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}.tutor-b@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '09:00', ${quote(`${marker}-invoice-a`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '10:00', ${quote(`${marker}-invoice-b`)}, p.id, t.id, ${clinicB}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-b@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '11:00', ${quote(`${marker}-installment`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '12:00', ${quote(`${marker}-reversal`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId")
SELECT 5.00, ${clinicA}, id FROM "Appointment" WHERE notes = ${quote(`${marker}-invoice-a`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId")
SELECT 5.00, ${clinicB}, id FROM "Appointment" WHERE notes = ${quote(`${marker}-invoice-b`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId")
SELECT 5.00, ${clinicA}, id FROM "Appointment" WHERE notes = ${quote(`${marker}-installment`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId")
SELECT 1.00, ${clinicA}, id FROM "Appointment" WHERE notes = ${quote(`${marker}-reversal`)};
INSERT INTO "CatalogService" ("clinicId", "name", "price", "durationMinutes", "category", "updatedAt")
VALUES (${clinicA}, ${quote(`${marker}-catalog`)}, 5.00, 30, 'TESTE', CURRENT_TIMESTAMP);
INSERT INTO "ServicePackage" ("clinicId", "name", "price", "totalSessions", "validityDays", "coveredCatalogServiceId", "updatedAt")
SELECT ${clinicA}, ${quote(`${marker}-package`)}, 10.00, 1, 30, id, CURRENT_TIMESTAMP FROM "CatalogService" WHERE name = ${quote(`${marker}-catalog`)};
INSERT INTO "PackageContract" ("clinicId", "packageId", "tutorId", "petId", "contractedPrice", "totalSessions", "remainingSessions", "expiresAt", "updatedAt")
SELECT ${clinicA}, sp.id, t.id, p.id, 10.00, 1, 1, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP
FROM "ServicePackage" sp JOIN "Tutor" t ON t.email = ${quote(`${marker}.tutor-a@example.invalid`)}
JOIN "Pet" p ON p."tutorId" = t.id WHERE sp.name = ${quote(`${marker}-package`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '13:00', ${quote(`${marker}-package-a`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '14:00', ${quote(`${marker}-package-b`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}.tutor-a@example.invalid`)};
INSERT INTO "Service" ("name", "price", "clinicId", "catalogServiceId", "appointmentId")
SELECT ${quote(`${marker}-service-a`)}, 5.00, ${clinicA}, cs.id, a.id FROM "CatalogService" cs JOIN "Appointment" a ON a.notes = ${quote(`${marker}-package-a`)} WHERE cs.name = ${quote(`${marker}-catalog`)};
INSERT INTO "Service" ("name", "price", "clinicId", "catalogServiceId", "appointmentId")
SELECT ${quote(`${marker}-service-b`)}, 5.00, ${clinicA}, cs.id, a.id FROM "CatalogService" cs JOIN "Appointment" a ON a.notes = ${quote(`${marker}-package-b`)} WHERE cs.name = ${quote(`${marker}-catalog`)};
INSERT INTO "Product" ("name", "price", "quantity", "clinicId", "updatedAt") VALUES (${quote(`${marker}-product`)}, 1.00, 1, ${clinicA}, CURRENT_TIMESTAMP);
INSERT INTO "ProductLot" ("clinicId", "productId", "lotCode", "quantity")
SELECT ${clinicA}, id, ${quote(`${marker}-lot`)}, 1 FROM "Product" WHERE name = ${quote(`${marker}-product`)};
INSERT INTO "Product" ("name", "price", "quantity", "clinicId", "updatedAt") VALUES (${quote(`${marker}-product-b`)}, 1.00, 1, ${clinicB}, CURRENT_TIMESTAMP);
INSERT INTO "ProductLot" ("clinicId", "productId", "lotCode", "quantity")
SELECT ${clinicB}, id, ${quote(`${marker}-lot-b`)}, 1 FROM "Product" WHERE name = ${quote(`${marker}-product-b`)};
COMMIT;`);
}

async function ids() {
  const one = async (notes) => scalar(`SELECT id FROM "Appointment" WHERE notes = ${quote(notes)};`);
  return {
    invoiceA: await scalar(`SELECT id FROM "Invoice" WHERE "clinicId" = ${clinicA} AND "appointmentId" = (SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-invoice-a`)});`),
    invoiceB: await scalar(`SELECT id FROM "Invoice" WHERE "clinicId" = ${clinicB} AND "appointmentId" = (SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-invoice-b`)});`),
    installmentInvoice: await scalar(`SELECT id FROM "Invoice" WHERE "appointmentId" = (SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-installment`)});`),
    reversalInvoice: await scalar(`SELECT id FROM "Invoice" WHERE "appointmentId" = (SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-reversal`)});`),
    contract: await scalar(`SELECT id FROM "PackageContract" WHERE "clinicId" = ${clinicA} AND "packageId" = (SELECT id FROM "ServicePackage" WHERE name = ${quote(`${marker}-package`)});`),
    packageAppointmentA: await one(`${marker}-package-a`),
    packageAppointmentB: await one(`${marker}-package-b`),
    serviceA: await scalar(`SELECT id FROM "Service" WHERE name = ${quote(`${marker}-service-a`)};`),
    serviceB: await scalar(`SELECT id FROM "Service" WHERE name = ${quote(`${marker}-service-b`)};`),
    product: await scalar(`SELECT id FROM "Product" WHERE name = ${quote(`${marker}-product`)};`),
    lot: await scalar(`SELECT id FROM "ProductLot" WHERE "lotCode" = ${quote(`${marker}-lot`)};`),
    productB: await scalar(`SELECT id FROM "Product" WHERE name = ${quote(`${marker}-product-b`)};`),
  };
}

async function login(email) {
  const result = await json('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  assert(result.status === 200 && typeof result.body?.accessToken === 'string', `login HTTP ${result.status}`);
  return result.body.accessToken;
}

function statuses(results) { return results.map((result) => result.status); }

async function payments(fixture, tokenA, tokenB) {
  const distinct = await concurrent([
    authenticated(tokenA, `/api/financial/invoices/${fixture.invoiceA}/payments`, { amount: 5, method: 'TEST_HTTP', idempotencyKey: `${marker}-pay-a` }),
    authenticated(tokenA, `/api/financial/invoices/${fixture.invoiceA}/payments`, { amount: 5, method: 'TEST_HTTP', idempotencyKey: `${marker}-pay-b` }),
  ]);
  const distinctCount = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${fixture.invoiceA} AND "idempotencyKey" LIKE ${quote(`${marker}-pay-%`)};`);
  const distinctTotal = await scalar(`SELECT COALESCE(sum(amount), 0) FROM "Payment" WHERE "invoiceId" = ${fixture.invoiceA} AND "idempotencyKey" LIKE ${quote(`${marker}-pay-%`)};`);

  const sameKey = await concurrent([
    authenticated(tokenA, `/api/financial/invoices/${fixture.installmentInvoice}/payments`, { amount: 2.50, method: 'TEST_HTTP', idempotencyKey: `${marker}-same-key` }),
    authenticated(tokenA, `/api/financial/invoices/${fixture.installmentInvoice}/payments`, { amount: 2.50, method: 'TEST_HTTP', idempotencyKey: `${marker}-same-key` }),
  ]);
  const sameKeyCount = await scalar(`SELECT count(*) FROM "Payment" WHERE "idempotencyKey" = ${quote(`${marker}-same-key`)};`);

  const equalValue = await concurrent([
    authenticated(tokenA, `/api/financial/invoices/${fixture.installmentInvoice}/payments`, { amount: 2.50, method: 'TEST_HTTP', idempotencyKey: `${marker}-install-a` }),
    authenticated(tokenA, `/api/financial/invoices/${fixture.installmentInvoice}/payments`, { amount: 2.50, method: 'TEST_HTTP', idempotencyKey: `${marker}-install-b` }),
  ]);
  const equalCount = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${fixture.installmentInvoice} AND "idempotencyKey" LIKE ${quote(`${marker}-install-%`)};`);

  const crossClinic = await authenticated(tokenA, `/api/financial/invoices/${fixture.invoiceB}/payments`, { amount: 5, method: 'TEST_HTTP', idempotencyKey: `${marker}-cross-clinic` });
  const crossClinicRows = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${fixture.invoiceB} AND "idempotencyKey" = ${quote(`${marker}-cross-clinic`)};`);
  const receivedBy = await scalar(`SELECT count(*) FROM "Payment" p JOIN "User" u ON u.id = p."receivedByUserId" WHERE p."invoiceId" = ${fixture.invoiceA} AND u."clinicId" = ${clinicA} AND p."idempotencyKey" LIKE ${quote(`${marker}-pay-%`)};`);

  return {
    distinctKeys: { statuses: statuses(distinct), rows: distinctCount, total: distinctTotal, passed: distinctCount === '1' && distinctTotal === '5.00' },
    sameKey: { statuses: statuses(sameKey), rows: sameKeyCount, passed: sameKeyCount === '1' },
    equalValueDistinctKeys: { statuses: statuses(equalValue), rows: equalCount, passed: equalCount === '2' },
    crossClinicWrite: { status: crossClinic.status, rows: crossClinicRows, passed: crossClinic.status !== 201 && crossClinicRows === '0' },
    authenticatedAuthor: { rows: receivedBy, passed: receivedBy === '1' },
    tokenBCanReadOwnClinic: (await authenticated(tokenB, `/api/invoices/${fixture.invoiceB}`, undefined, 'GET')).status,
  };
}

async function packageConsumption(fixture, tokenA, tokenB) {
  const result = await concurrent([
    authenticated(tokenA, `/api/packages/contracts/${fixture.contract}/consume`, { appointmentId: Number(fixture.packageAppointmentA), serviceId: Number(fixture.serviceA) }),
    authenticated(tokenA, `/api/packages/contracts/${fixture.contract}/consume`, { appointmentId: Number(fixture.packageAppointmentB), serviceId: Number(fixture.serviceB) }),
  ]);
  const sessions = await scalar(`SELECT count(*) FROM "PackageSession" WHERE "contractId" = ${fixture.contract};`);
  const remaining = await scalar(`SELECT "remainingSessions" FROM "PackageContract" WHERE id = ${fixture.contract};`);
  const crossClinic = await authenticated(tokenB, `/api/packages/contracts/${fixture.contract}/consume`, { appointmentId: Number(fixture.packageAppointmentA), serviceId: Number(fixture.serviceA) });
  return { statuses: statuses(result), sessions, remaining, crossClinicStatus: crossClinic.status, passed: sessions === '1' && remaining === '0' && crossClinic.status !== 201 };
}

async function stock(fixture, tokenA, tokenB) {
  const result = await concurrent([
    authenticated(tokenA, '/api/inventory/issues', { productId: Number(fixture.product), lotId: Number(fixture.lot), quantity: 1, reason: 'HTTP concorrência sintética', idempotencyKey: `${marker}-stock-a` }),
    authenticated(tokenA, '/api/inventory/issues', { productId: Number(fixture.product), lotId: Number(fixture.lot), quantity: 1, reason: 'HTTP concorrência sintética', idempotencyKey: `${marker}-stock-b` }),
  ]);
  const quantity = await scalar(`SELECT quantity FROM "ProductLot" WHERE id = ${fixture.lot};`);
  const movements = await scalar(`SELECT count(*) FROM "StockMovement" WHERE "lotId" = ${fixture.lot} AND "reason" = 'HTTP concorrência sintética';`);
  const crossClinic = await authenticated(tokenB, '/api/inventory/issues', { productId: Number(fixture.product), lotId: Number(fixture.lot), quantity: 1, reason: 'cross clinic', idempotencyKey: `${marker}-cross-stock` });
  return { statuses: statuses(result), lotQuantity: quantity, movements, crossClinicStatus: crossClinic.status, passed: quantity === '0' && movements === '1' && crossClinic.status !== 201 };
}

async function reversals(fixture, tokenA) {
  const payment = await authenticated(tokenA, `/api/financial/invoices/${fixture.reversalInvoice}/payments`, { amount: 1, method: 'TEST_HTTP', idempotencyKey: `${marker}-reversal-payment` });
  if (payment.status !== 201) {
    return { paymentStatus: payment.status, paymentError: payment.body?.error || 'resposta sem detalhe', passed: false };
  }
  const paymentId = await scalar(`SELECT id FROM "Payment" WHERE "idempotencyKey" = ${quote(`${marker}-reversal-payment`)};`);
  const result = await concurrent([
    authenticated(tokenA, `/api/financial/payments/${paymentId}/reverse`, { reason: 'Estorno concorrente sintético A' }),
    authenticated(tokenA, `/api/financial/payments/${paymentId}/reverse`, { reason: 'Estorno concorrente sintético B' }),
  ]);
  const reversed = await scalar(`SELECT count(*) FROM "Payment" WHERE id = ${paymentId} AND status = 'REVERSED';`);
  const audits = await scalar(`SELECT count(*) FROM "FinancialAuditEvent" WHERE "paymentId" = ${paymentId} AND "eventType" = 'PAYMENT_REVERSED';`);
  return { paymentId: Number(paymentId), statuses: statuses(result), reversed, audits, passed: reversed === '1' && audits === '1' };
}

async function crossClinicReads(fixture, tokenA) {
  const invoice = await authenticated(tokenA, `/api/invoices/${fixture.invoiceB}`, undefined, 'GET');
  const lots = await authenticated(tokenA, `/api/inventory/lots?productId=${fixture.productB}`, undefined, 'GET');
  return { invoiceStatus: invoice.status, stockStatus: lots.status, passed: invoice.status === 404 && lots.status === 200 && Array.isArray(lots.body?.data) && lots.body.data.length === 0 };
}

async function cleanup() {
  await runSql(`
BEGIN;
DELETE FROM "FinancialAuditEvent" WHERE "paymentId" IN (SELECT id FROM "Payment" WHERE "idempotencyKey" LIKE ${quote(`${marker}%`)}) OR metadata::text LIKE ${quote(`%${marker}%`)};
DELETE FROM "Payment" WHERE "idempotencyKey" LIKE ${quote(`${marker}%`)};
DELETE FROM "PackageSession" WHERE "contractId" IN (SELECT id FROM "PackageContract" WHERE "clinicId" = ${clinicA});
DELETE FROM "StockMovement" WHERE "reason" = 'HTTP concorrência sintética' OR "idempotencyKey" LIKE ${quote(`${marker}%`)};
DELETE FROM "ProductLot" WHERE "lotCode" LIKE ${quote(`${marker}%`)};
DELETE FROM "Product" WHERE "name" LIKE ${quote(`${marker}%`)};
DELETE FROM "Service" WHERE "name" LIKE ${quote(`${marker}%`)};
DELETE FROM "PackageContract" WHERE "clinicId" = ${clinicA};
DELETE FROM "ServicePackage" WHERE "name" LIKE ${quote(`${marker}%`)};
DELETE FROM "CatalogService" WHERE "name" LIKE ${quote(`${marker}%`)};
DELETE FROM "Invoice" WHERE "clinicId" IN (${clinicA}, ${clinicB}) AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes LIKE ${quote(`${marker}%`)});
DELETE FROM "Appointment" WHERE notes LIKE ${quote(`${marker}%`)};
DELETE FROM "Pet" WHERE name LIKE ${quote(`${marker}%`)};
DELETE FROM "Tutor" WHERE email LIKE ${quote(`${marker}%`)};
DELETE FROM "User" WHERE name LIKE ${quote(`${marker}%`)};
DELETE FROM "AuthProfile" WHERE email LIKE ${quote(`${marker}%`)};
COMMIT;`);
}

await assertLocalContainer();
let created = false;
try {
  await createFixtures();
  created = true;
  const fixture = await ids();
  const [tokenA, tokenVetA, tokenB] = await Promise.all([login(emailA), login(emailAVet), login(emailB)]);
  const report = {
    ok: true,
    marker,
    baseUrl,
    database,
    independentHttpRequests: true,
    clinics: [clinicA, clinicB],
    scenarios: {
      payments: await payments(fixture, tokenA, tokenB),
      packageLastSession: await packageConsumption(fixture, tokenVetA, tokenB),
      stockInsufficient: await stock(fixture, tokenVetA, tokenB),
      concurrentReversals: await reversals(fixture, tokenA),
      crossClinicReads: await crossClinicReads(fixture, tokenVetA),
    },
  };
  report.ok = report.scenarios.payments.distinctKeys.passed
    && report.scenarios.payments.sameKey.passed
    && report.scenarios.payments.equalValueDistinctKeys.passed
    && report.scenarios.payments.crossClinicWrite.passed
    && report.scenarios.payments.authenticatedAuthor.passed
    && report.scenarios.packageLastSession.passed
    && report.scenarios.stockInsufficient.passed
    && report.scenarios.concurrentReversals.passed
    && report.scenarios.crossClinicReads.passed;
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 2;
} finally {
  if (created) await cleanup();
}
