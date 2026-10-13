#!/usr/bin/env node

/*
 * Prova de concorrência HTTP contra o bootstrap real e o PostgreSQL local.
 *
 * Este script não usa mocks, não faz login externo e não imprime segredos.
 * Ele cria somente fixtures com marcador exclusivo no container local,
 * assina tokens sintéticos em memória e remove as fixtures ao finalizar.
 */
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import jwt from 'jsonwebtoken';

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, '../..');
const container = process.env.EUMAEUS_LOCAL_PG_CONTAINER || 'eumaeus-postgres-local';
const database = 'eumaeus_local';
const dbUser = 'eumaeus';
const dbPassword = 'eumaeus_local_only';
const clinicA = 9401;
const clinicB = 9402;
const marker = `http-concurrency-${Date.now()}-${randomBytes(4).toString('hex')}`;
const jwtSecret = randomBytes(32).toString('hex');
const refreshSecret = randomBytes(32).toString('hex');

const docker = (args, input = '') => new Promise((resolvePromise, reject) => {
  const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.once('error', reject);
  child.once('close', (code) => resolvePromise({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
  child.stdin.end(input);
});

const runSql = async (sql) => {
  const result = await docker([
    'exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1',
    '-U', dbUser, '-d', database, '-At', '-F', '\t',
  ], sql);
  if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'psql failed');
  return result.stdout;
};

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const scalar = async (sql) => {
  const value = (await runSql(sql)).split('\n').filter(Boolean).at(-1);
  if (value === undefined) throw new Error(`Consulta sem resultado: ${sql}`);
  return value;
};
const assert = (condition, message) => {
  if (!condition) throw new Error(`PROVA FALHOU: ${message}`);
};
const concurrent = (requests) => Promise.all(requests);

const findFreePort = () => new Promise((resolvePromise, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    probe.close(() => resolvePromise(port));
  });
});

async function assertLocalContainer() {
  const result = await docker(['inspect', container]);
  assert(result.code === 0, `container ${container} não encontrado`);
  const inspected = JSON.parse(result.stdout)[0];
  assert(inspected?.State?.Running === true, 'container PostgreSQL não está ativo');
  assert(/^postgres(?::|$)/i.test(inspected?.Config?.Image || ''), 'alvo não é uma imagem PostgreSQL');
  assert(inspected?.Config?.Env?.includes('POSTGRES_DB=eumaeus_local'), 'banco alvo não é eumaeus_local');
}

async function createFixtures() {
  await runSql(`
BEGIN;
INSERT INTO "Role" ("name", "description") VALUES ('DONO', 'synthetic HTTP concurrency') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "AuthProfile" ("email", "password") VALUES (${quote(`${marker}@example.invalid`)}, 'synthetic-hash-not-for-login') RETURNING id;
INSERT INTO "User" ("name", "clinicId", "roleName", "authProfileId", "updatedAt")
SELECT ${quote(`${marker}-owner`)}, ${clinicA}, 'DONO', id, CURRENT_TIMESTAMP FROM "AuthProfile" WHERE email = ${quote(`${marker}@example.invalid`)};
INSERT INTO "Tutor" ("name", "email", "phone", "clinicId", "updatedAt")
VALUES (${quote(`${marker}-tutor-a`)}, ${quote(`${marker}-a@example.invalid`)}, '00000000001', ${clinicA}, CURRENT_TIMESTAMP),
       (${quote(`${marker}-tutor-b`)}, ${quote(`${marker}-b@example.invalid`)}, '00000000002', ${clinicB}, CURRENT_TIMESTAMP);
INSERT INTO "Pet" ("name", "species", "breed", "tutorId", "clinicId", "updatedAt")
SELECT ${quote(`${marker}-pet-a`)}, 'TESTE', 'SINTETICO', id, ${clinicA}, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}-a@example.invalid`)};
INSERT INTO "Pet" ("name", "species", "breed", "tutorId", "clinicId", "updatedAt")
SELECT ${quote(`${marker}-pet-b`)}, 'TESTE', 'SINTETICO', id, ${clinicB}, CURRENT_TIMESTAMP FROM "Tutor" WHERE email = ${quote(`${marker}-b@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '09:00', ${quote(marker)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '10:00', ${quote(`${marker}-package-1`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '11:00', ${quote(`${marker}-package-2`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '12:00', ${quote(`${marker}-idempotency`)}, p.id, t.id, ${clinicA}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}-a@example.invalid`)};
INSERT INTO "Appointment" ("appointmentDate", "date", "time", "notes", "petId", "tutorId", "clinicId", "updatedAt")
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '13:00', ${quote(`${marker}-cross-clinic`)}, p.id, t.id, ${clinicB}, CURRENT_TIMESTAMP
FROM "Pet" p JOIN "Tutor" t ON t.id = p."tutorId" WHERE t.email = ${quote(`${marker}-b@example.invalid`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId") SELECT 5.00, ${clinicA}, id FROM "Appointment" WHERE notes = ${quote(marker)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId") SELECT 2.00, ${clinicA}, id FROM "Appointment" WHERE notes = ${quote(`${marker}-idempotency`)};
INSERT INTO "Invoice" ("totalAmount", "clinicId", "appointmentId") SELECT 5.00, ${clinicB}, id FROM "Appointment" WHERE notes = ${quote(`${marker}-cross-clinic`)};
INSERT INTO "CatalogService" ("clinicId", "name", "price", "durationMinutes", "category", "updatedAt")
VALUES (${clinicA}, ${quote(`${marker}-catalog`)}, 5.00, 30, 'TESTE', CURRENT_TIMESTAMP);
INSERT INTO "ServicePackage" ("clinicId", "name", "price", "totalSessions", "validityDays", "coveredCatalogServiceId", "updatedAt")
SELECT ${clinicA}, ${quote(`${marker}-package`)}, 10.00, 1, 30, id, CURRENT_TIMESTAMP FROM "CatalogService" WHERE name = ${quote(`${marker}-catalog`)};
INSERT INTO "PackageContract" ("clinicId", "packageId", "tutorId", "petId", "contractedPrice", "totalSessions", "remainingSessions", "expiresAt", "updatedAt")
SELECT ${clinicA}, sp.id, t.id, p.id, 10.00, 1, 1, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP
FROM "ServicePackage" sp JOIN "Tutor" t ON t.email = ${quote(`${marker}-a@example.invalid`)}
JOIN "Pet" p ON p."tutorId" = t.id WHERE sp.name = ${quote(`${marker}-package`)};
INSERT INTO "Service" ("name", "price", "clinicId", "catalogServiceId", "appointmentId")
SELECT ${quote(`${marker}-service-1`)}, 5.00, ${clinicA}, cs.id, a.id FROM "CatalogService" cs JOIN "Appointment" a ON a.notes = ${quote(`${marker}-package-1`)} WHERE cs.name = ${quote(`${marker}-catalog`)};
INSERT INTO "Service" ("name", "price", "clinicId", "catalogServiceId", "appointmentId")
SELECT ${quote(`${marker}-service-2`)}, 5.00, ${clinicA}, cs.id, a.id FROM "CatalogService" cs JOIN "Appointment" a ON a.notes = ${quote(`${marker}-package-2`)} WHERE cs.name = ${quote(`${marker}-catalog`)};
INSERT INTO "Product" ("name", "price", "quantity", "clinicId", "updatedAt") VALUES (${quote(`${marker}-product`)}, 1.00, 1, ${clinicA}, CURRENT_TIMESTAMP);
INSERT INTO "ProductLot" ("clinicId", "productId", "lotCode", "quantity") SELECT ${clinicA}, id, ${quote(`${marker}-lot`)}, 1 FROM "Product" WHERE name = ${quote(`${marker}-product`)};
COMMIT;`);
}

async function fixtureIds() {
  return {
    user: await scalar(`SELECT id FROM "User" WHERE "clinicId" = ${clinicA} AND name = ${quote(`${marker}-owner`)};`),
    invoice: await scalar(`SELECT id FROM "Invoice" WHERE "clinicId" = ${clinicA} AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes = ${quote(marker)});`),
    idempotencyInvoice: await scalar(`SELECT id FROM "Invoice" WHERE "clinicId" = ${clinicA} AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-idempotency`)});`),
    contract: await scalar(`SELECT id FROM "PackageContract" WHERE "clinicId" = ${clinicA} AND "tutorId" IN (SELECT id FROM "Tutor" WHERE email = ${quote(`${marker}-a@example.invalid`)});`),
    appointmentA: await scalar(`SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-package-1`)};`),
    appointmentB: await scalar(`SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-package-2`)};`),
    serviceA: await scalar(`SELECT id FROM "Service" WHERE name = ${quote(`${marker}-service-1`)};`),
    serviceB: await scalar(`SELECT id FROM "Service" WHERE name = ${quote(`${marker}-service-2`)};`),
    product: await scalar(`SELECT id FROM "Product" WHERE name = ${quote(`${marker}-product`)};`),
    lot: await scalar(`SELECT id FROM "ProductLot" WHERE "lotCode" = ${quote(`${marker}-lot`)};`),
    crossInvoice: await scalar(`SELECT id FROM "Invoice" WHERE "clinicId" = ${clinicB} AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes = ${quote(`${marker}-cross-clinic`)});`),
  };
}

const tokenFor = (userId, clinicId, role = 'DONO') => jwt.sign({ id: Number(userId), type: 'user', role, clinicId }, jwtSecret, { algorithm: 'HS256', expiresIn: '10m' });

async function startBackend(port) {
  // Usa o bootstrap fonte em transpile-only para que a prova HTTP não dependa
  // de um dist potencialmente antigo. O build tipado continua sendo executado
  // separadamente e seus erros não são ocultados por este harness.
  const child = spawn('node_modules/.bin/ts-node', ['--transpile-only', 'src/bootstrap.ts'], {
    cwd: backendRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      DATABASE_URL: `postgresql://${dbUser}:${dbPassword}@127.0.0.1:55432/${database}`,
      JWT_SECRET: jwtSecret,
      REFRESH_TOKEN_SECRET: refreshSecret,
      RATE_LIMIT_API_MAX_REQUESTS: '1000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  // O bootstrap importa os módulos de integração antes de abrir a porta;
  // sob carga local isso pode passar de cinco segundos. O limite é finito
  // para distinguir lentidão observada de travamento.
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      if (health.ok) return { child, output: () => output };
    } catch { /* aguardando o bootstrap */ }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  child.kill('SIGTERM');
  throw new Error(`bootstrap local não iniciou: ${output.slice(-500)}`);
}

async function request(base, token, path, body) {
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: response.status, body: parsed };
}

async function assertHttpConcurrency(base, ids, token) {
  const observations = {};
  const payments = await concurrent([
    request(base, token, `/api/financial/invoices/${ids.invoice}/payments`, { amount: 5, method: 'PIX', idempotencyKey: `${marker}-pay-a` }),
    request(base, token, `/api/financial/invoices/${ids.invoice}/payments`, { amount: 5, method: 'PIX', idempotencyKey: `${marker}-pay-b` }),
  ]);
  const paymentRows = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${ids.invoice} AND "idempotencyKey" LIKE ${quote(`${marker}-pay-%`)};`);
  const paymentTotal = await scalar(`SELECT COALESCE(sum("amount"), 0) FROM "Payment" WHERE "invoiceId" = ${ids.invoice} AND "idempotencyKey" LIKE ${quote(`${marker}-pay-%`)};`);
  observations.payments = { responses: payments.map((item) => item.status), rows: paymentRows, total: paymentTotal, passed: paymentRows === '1' && paymentTotal === '5.00' };

  const sameKey = await concurrent([
    request(base, token, `/api/financial/invoices/${ids.idempotencyInvoice}/payments`, { amount: 1, method: 'PIX', idempotencyKey: `${marker}-same-key` }),
    request(base, token, `/api/financial/invoices/${ids.idempotencyInvoice}/payments`, { amount: 1, method: 'PIX', idempotencyKey: `${marker}-same-key` }),
  ]);
  const sameKeyRows = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${ids.idempotencyInvoice} AND "idempotencyKey" = ${quote(`${marker}-same-key`)};`);
  observations.sameIdempotencyKey = { responses: sameKey.map((item) => item.status), rows: sameKeyRows, passed: sameKeyRows === '1' };

  const packageResults = await concurrent([
    request(base, token, `/api/packages/contracts/${ids.contract}/consume`, { appointmentId: Number(ids.appointmentA), serviceId: Number(ids.serviceA) }),
    request(base, token, `/api/packages/contracts/${ids.contract}/consume`, { appointmentId: Number(ids.appointmentB), serviceId: Number(ids.serviceB) }),
  ]);
  const sessions = await scalar(`SELECT count(*) FROM "PackageSession" WHERE "contractId" = ${ids.contract};`);
  const remaining = await scalar(`SELECT "remainingSessions" FROM "PackageContract" WHERE id = ${ids.contract};`);
  observations.package = { responses: packageResults.map((item) => item.status), sessions, remaining, passed: sessions === '1' && remaining === '0' };

  const stockResults = await concurrent([
    request(base, token, '/api/inventory/issues', { productId: Number(ids.product), lotId: Number(ids.lot), quantity: 1, reason: 'HTTP concorrência sintética', idempotencyKey: `${marker}-stock-a` }),
    request(base, token, '/api/inventory/issues', { productId: Number(ids.product), lotId: Number(ids.lot), quantity: 1, reason: 'HTTP concorrência sintética', idempotencyKey: `${marker}-stock-b` }),
  ]);
  const lotQuantity = await scalar(`SELECT quantity FROM "ProductLot" WHERE id = ${ids.lot};`);
  const movementRows = await scalar(`SELECT count(*) FROM "StockMovement" WHERE "lotId" = ${ids.lot} AND "idempotencyKey" LIKE ${quote(`${marker}-stock-%`)};`);
  observations.stock = { responses: stockResults.map((item) => item.status), lotQuantity, movements: movementRows, passed: lotQuantity === '0' && movementRows === '1' };

  const crossClinic = await request(base, token, `/api/invoices/${ids.crossInvoice}`);
  const crossClinicWrite = await request(base, token, `/api/financial/invoices/${ids.crossInvoice}/payments`, { amount: 1, method: 'PIX', idempotencyKey: `${marker}-cross-write` });
  const crossClinicPayments = await scalar(`SELECT count(*) FROM "Payment" WHERE "invoiceId" = ${ids.crossInvoice} AND "idempotencyKey" = ${quote(`${marker}-cross-write`)};`);
  observations.crossClinic = { readStatus: crossClinic.status, writeStatus: crossClinicWrite.status, createdPayments: crossClinicPayments, passed: crossClinic.status === 404 && crossClinicWrite.status === 409 && crossClinicPayments === '0' };

  let paymentId = (await runSql(`SELECT id FROM "Payment" WHERE "invoiceId" = ${ids.invoice} AND "idempotencyKey" LIKE ${quote(`${marker}-pay-%`)} ORDER BY id LIMIT 1;`)).trim();
  if (!paymentId) {
    await runSql(`INSERT INTO "Payment" ("clinicId", "invoiceId", "amount", "method", "idempotencyKey") VALUES (${clinicA}, ${ids.invoice}, 1.00, 'PIX', ${quote(`${marker}-reversal-seed`)});`);
    paymentId = await scalar(`SELECT id FROM "Payment" WHERE "idempotencyKey" = ${quote(`${marker}-reversal-seed`)};`);
  }
  const reversals = await concurrent([
    request(base, token, `/api/financial/payments/${paymentId}/reverse`, { reason: 'Estorno concorrente sintético A' }),
    request(base, token, `/api/financial/payments/${paymentId}/reverse`, { reason: 'Estorno concorrente sintético B' }),
  ]);
  const reversedRows = await scalar(`SELECT count(*) FROM "Payment" WHERE id = ${paymentId} AND status = 'REVERSED';`);
  const auditRows = await scalar(`SELECT count(*) FROM "FinancialAuditEvent" WHERE "paymentId" = ${paymentId} AND "eventType" = 'PAYMENT_REVERSED';`);
  observations.reversals = { responses: reversals.map((item) => item.status), reversedRows, auditRows, passed: reversedRows === '1' && auditRows === '1' };
  return observations;
}

async function cleanup() {
  await runSql(`
BEGIN;
DELETE FROM "FinancialAuditEvent" WHERE "paymentId" IN (SELECT id FROM "Payment" WHERE "clinicId" = ${clinicA});
DELETE FROM "Payment" WHERE "clinicId" = ${clinicA};
DELETE FROM "PackageSession" WHERE "contractId" IN (SELECT id FROM "PackageContract" WHERE "clinicId" = ${clinicA});
DELETE FROM "StockMovement" WHERE "clinicId" = ${clinicA};
DELETE FROM "ProductLot" WHERE "clinicId" = ${clinicA};
DELETE FROM "Product" WHERE "clinicId" = ${clinicA};
DELETE FROM "PackageContract" WHERE "clinicId" = ${clinicA};
DELETE FROM "Service" WHERE "clinicId" = ${clinicA};
DELETE FROM "ServicePackage" WHERE "clinicId" = ${clinicA};
DELETE FROM "CatalogService" WHERE "clinicId" = ${clinicA};
DELETE FROM "Invoice" WHERE "clinicId" IN (${clinicA}, ${clinicB}) AND "appointmentId" IN (SELECT id FROM "Appointment" WHERE notes LIKE ${quote(`${marker}%`)});
DELETE FROM "Appointment" WHERE "clinicId" IN (${clinicA}, ${clinicB}) AND notes LIKE ${quote(`${marker}%`)};
DELETE FROM "Pet" WHERE "clinicId" IN (${clinicA}, ${clinicB}) AND name LIKE ${quote(`${marker}%`)};
DELETE FROM "Tutor" WHERE "clinicId" IN (${clinicA}, ${clinicB}) AND email LIKE ${quote(`${marker}%`)};
DELETE FROM "User" WHERE "clinicId" = ${clinicA} AND name = ${quote(`${marker}-owner`)};
DELETE FROM "AuthProfile" WHERE email = ${quote(`${marker}@example.invalid`)};
COMMIT;`);
}

let serverProcess;
let fixtureCreated = false;
try {
  await assertLocalContainer();
  await createFixtures();
  fixtureCreated = true;
  const ids = await fixtureIds();
  const port = await findFreePort();
  const started = await startBackend(port);
  serverProcess = started.child;
  const token = tokenFor(ids.user, clinicA);
  const result = await assertHttpConcurrency(`http://127.0.0.1:${port}`, ids, token);
  console.log(JSON.stringify({ ok: true, target: 'local-postgresql-http', marker, ...result }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, target: 'local-postgresql-http', error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
} finally {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise((resolvePromise) => serverProcess.once('exit', resolvePromise));
  }
  if (fixtureCreated) {
    try { await cleanup(); } catch (error) { console.error(`limpeza sintética falhou: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
  }
}
