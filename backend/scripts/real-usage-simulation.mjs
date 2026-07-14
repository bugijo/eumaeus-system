import { performance } from 'node:perf_hooks';

const nodeEnvironment = process.env.NODE_ENV?.trim().toLowerCase();
if (!['development', 'test'].includes(nodeEnvironment)) {
  throw new Error('Simulação bloqueada: NODE_ENV deve ser development ou test.');
}

if (process.env.ALLOW_TEST_DATA_MUTATION?.trim().toLowerCase() !== 'true') {
  throw new Error('Simulação bloqueada: defina ALLOW_TEST_DATA_MUTATION=true.');
}

function requireEnvironmentVariable(name, minimumLength = 1) {
  const value = process.env[name];
  if (!value || value.trim() !== value || value.length < minimumLength) {
    throw new Error(`${name} é obrigatória para a simulação local.`);
  }
  return value;
}

const simulationUrl = new URL(requireEnvironmentVariable('SIM_BASE_URL'));
const allowedHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
if (!['http:', 'https:'].includes(simulationUrl.protocol) || !allowedHosts.has(simulationUrl.hostname)) {
  throw new Error('SIM_BASE_URL deve apontar explicitamente para localhost.');
}

const BASE_URL = simulationUrl.toString().replace(/\/$/, '');
const DAYS = Number(process.env.SIM_DAYS || 30);
const REQUEST_GAP_MS = Number(process.env.SIM_REQUEST_GAP_MS || 220);
const MAX_RETRIES_429 = 4;

const users = {
  admin: {
    email: requireEnvironmentVariable('SIM_ADMIN_EMAIL'),
    password: requireEnvironmentVariable('SIM_ADMIN_PASSWORD', 12),
  },
  vet: {
    email: requireEnvironmentVariable('SIM_VET_EMAIL'),
    password: requireEnvironmentVariable('SIM_VET_PASSWORD', 12),
  },
  recepcao: {
    email: requireEnvironmentVariable('SIM_RECEPCAO_EMAIL'),
    password: requireEnvironmentVariable('SIM_RECEPCAO_PASSWORD', 12),
  },
  auxiliar: {
    email: requireEnvironmentVariable('SIM_AUXILIAR_EMAIL'),
    password: requireEnvironmentVariable('SIM_AUXILIAR_PASSWORD', 12),
  },
};

const tutorFirst = ['Carlos', 'Mariana', 'Felipe', 'Patricia', 'Ricardo', 'Juliana', 'Anderson', 'Camila', 'Lucas', 'Fernanda'];
const tutorLast = ['Silva', 'Santos', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Melo', 'Almeida'];
const petNames = ['Mel', 'Rex', 'Luna', 'Theo', 'Nina', 'Zeus', 'Bidu', 'Belinha', 'Thor', 'Simba'];
const species = ['Cachorro', 'Gato'];
const breeds = {
  Cachorro: ['SRD', 'Labrador', 'Poodle', 'Shih Tzu', 'Pastor Alemao'],
  Gato: ['SRD', 'Siames', 'Persa', 'Maine Coon', 'Angora'],
};

const runId = `${Date.now()}`;
const tokens = {};

const metrics = {
  byOp: new Map(),
  failures: [],
  startTs: new Date().toISOString(),
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dateStringDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addMetric(op, durationMs, status, expectedStatuses, note = '') {
  const expected = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  const ok = expected.includes(status);

  if (!metrics.byOp.has(op)) {
    metrics.byOp.set(op, { count: 0, ok: 0, fail: 0, durations: [], statuses: {} });
  }

  const row = metrics.byOp.get(op);
  row.count += 1;
  row.durations.push(durationMs);
  row.statuses[status] = (row.statuses[status] || 0) + 1;
  if (ok) {
    row.ok += 1;
  } else {
    row.fail += 1;
    metrics.failures.push({ op, status, durationMs, note });
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function request(op, method, path, token, body, expectedStatuses, note = '') {
  let attempt = 0;

  while (true) {
    attempt += 1;
    const started = performance.now();
    let status = 0;
    let data = null;
    let text = '';

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      status = resp.status;
      text = await resp.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
    } catch (e) {
      status = 0;
      data = e?.message || String(e);
    }

    const durationMs = performance.now() - started;

    if (status === 429 && attempt <= MAX_RETRIES_429) {
      addMetric(`${op}#429-retry`, durationMs, status, [429], `retry=${attempt}`);
      await sleep(700 * attempt);
      continue;
    }

    addMetric(op, durationMs, status, expectedStatuses, note || (typeof data === 'string' ? data.slice(0, 160) : ''));
    await sleep(REQUEST_GAP_MS);

    return { status, data, durationMs };
  }
}

async function login(roleKey) {
  const u = users[roleKey];
  const r = await request(`login.${roleKey}`, 'POST', '/auth/login', '', { email: u.email, password: u.password }, [200]);
  if (r.status === 200 && r.data?.accessToken) {
    tokens[roleKey] = r.data.accessToken;
    return true;
  }
  return false;
}

async function runDay(dayIndex) {
  const date = dateStringDaysAgo(DAYS - dayIndex);

  // Simula início de expediente: todos logam
  for (const role of Object.keys(users)) {
    await login(role);
  }

  if (!tokens.admin || !tokens.vet || !tokens.recepcao || !tokens.auxiliar) {
    metrics.failures.push({ op: 'day.auth', status: 0, durationMs: 0, note: `falha login em d${dayIndex}` });
    return;
  }

  // Recepção cadastra tutor/pet e agenda consulta
  const tutorName = `${pick(tutorFirst)} ${pick(tutorLast)}`;
  const tutorEmail = `sim-real-${runId}-d${dayIndex}@eumaeus.com`;

  const tutorRes = await request(
    'recepcao.createTutor',
    'POST',
    '/tutors',
    tokens.recepcao,
    {
      name: tutorName,
      email: tutorEmail,
      phone: `(11) 9${rand(1000, 9999)}-${rand(1000, 9999)}`,
      address: `Rua Simulada ${rand(1, 999)}, São Paulo`,
    },
    [201]
  );

  if (tutorRes.status !== 201 || !tutorRes.data?.id) {
    return;
  }

  const sp = pick(species);
  const petRes = await request(
    'recepcao.createPet',
    'POST',
    `/tutors/${tutorRes.data.id}/pets`,
    tokens.recepcao,
    {
      name: pick(petNames),
      species: sp,
      breed: pick(breeds[sp]),
      birthDate: `${String(rand(1, 28)).padStart(2, '0')}/${String(rand(1, 12)).padStart(2, '0')}/${rand(2012, 2024)}`,
    },
    [201]
  );

  if (petRes.status !== 201 || !petRes.data?.id) {
    return;
  }

  const appointmentRes = await request(
    'recepcao.createAppointment',
    'POST',
    '/appointments',
    tokens.recepcao,
    {
      petId: petRes.data.id,
      tutorId: tutorRes.data.id,
      date,
      time: `${String(rand(8, 18)).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`,
      serviceType: pick(['Consulta', 'Retorno', 'Vacina', 'Check-up']),
      status: 'Agendado',
      notes: 'Fluxo simulado real.',
    },
    [201]
  );

  // Admin e auxiliar operando em paralelo enquanto a recepção agenda
  const appointmentId = appointmentRes.data?.id;
  const petId = petRes.data?.id;

  await Promise.all([
    request('admin.dashboardStats', 'GET', '/dashboard/stats', tokens.admin, null, [200]),
    request('admin.financialStats', 'GET', '/invoices/stats', tokens.admin, null, [200]),
    request('auxiliar.getRecordProducts', 'GET', '/records/products', tokens.auxiliar, null, [200]),
    request(
      'auxiliar.forbiddenCreateRecord',
      'POST',
      '/records/direct',
      tokens.auxiliar,
      {
        petId: petId || 1,
        symptoms: 'Teste',
        diagnosis: 'Teste',
        treatment: 'Teste',
        notes: 'Nao deveria permitir',
        usedProducts: [],
      },
      [403]
    ),
    request('vet.listAppointments', 'GET', '/appointments', tokens.vet, null, [200]),
    request('recepcao.forbiddenFinancial', 'GET', '/invoices/stats', tokens.recepcao, null, [403]),
  ]);

  if (!appointmentId) {
    return;
  }

  // 20% dos casos cancelados pela recepção, restante vai para atendimento completo
  const cancelFlow = Math.random() < 0.2;

  if (cancelFlow) {
    await request(
      'recepcao.cancelAppointment',
      'PUT',
      `/appointments/${appointmentId}`,
      tokens.recepcao,
      { status: 'Cancelado' },
      [200]
    );
    return;
  }

  // Veterinário conclui com prontuário
  const recordRes = await request(
    'vet.createMedicalRecord',
    'POST',
    `/records/${appointmentId}`,
    tokens.vet,
    {
      symptoms: pick(['Apatia leve', 'Prurido', 'Febre baixa', 'Consulta de rotina']),
      diagnosis: pick(['Gastroenterite leve', 'Dermatite', 'Acompanhamento clinico']),
      treatment: pick(['Hidratacao', 'Medicacao por 5 dias', 'Conduta expectante']),
      notes: 'Atendimento concluido no fluxo simulado.',
      products: [],
    },
    [201]
  );

  if (recordRes.status !== 201) {
    return;
  }

  // Financeiro: criação e baixa da fatura
  const invoiceRes = await request(
    'vet.createInvoice',
    'POST',
    `/invoices/from-appointment/${appointmentId}`,
    tokens.vet,
    null,
    [201, 409] // 409 se já existir por algum fluxo de repetição
  );

  const invoiceId = invoiceRes.data?.data?.id;
  if (invoiceRes.status === 201 && invoiceId && Math.random() < 0.7) {
    await request('admin.payInvoice', 'PATCH', `/invoices/${invoiceId}/status`, tokens.admin, { status: 'PAID' }, [200]);
  }
}

function buildSummary() {
  const operations = [];
  const allDurations = [];
  let total = 0;
  let ok = 0;
  let fail = 0;

  for (const [op, data] of metrics.byOp.entries()) {
    total += data.count;
    ok += data.ok;
    fail += data.fail;
    allDurations.push(...data.durations);

    const avg = data.durations.length ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length : 0;

    operations.push({
      op,
      count: data.count,
      ok: data.ok,
      fail: data.fail,
      avgMs: Number(avg.toFixed(2)),
      p95Ms: Number(percentile(data.durations, 95).toFixed(2)),
      maxMs: Number(Math.max(...data.durations, 0).toFixed(2)),
      statuses: data.statuses,
    });
  }

  operations.sort((a, b) => b.p95Ms - a.p95Ms);

  return {
    periodDays: DAYS,
    startedAt: metrics.startTs,
    finishedAt: new Date().toISOString(),
    totalRequests: total,
    successfulExpectations: ok,
    failedExpectations: fail,
    successRatePct: total ? Number(((ok / total) * 100).toFixed(2)) : 0,
    overallAvgMs: allDurations.length ? Number((allDurations.reduce((a, b) => a + b, 0) / allDurations.length).toFixed(2)) : 0,
    overallP95Ms: Number(percentile(allDurations, 95).toFixed(2)),
    overallMaxMs: Number(Math.max(...allDurations, 0).toFixed(2)),
    topSlowOperations: operations.slice(0, 12),
    failures: metrics.failures.slice(0, 100),
  };
}

async function main() {
  console.log(`Iniciando simulacao realista de ${DAYS} dias em ${BASE_URL}`);

  for (let day = 1; day <= DAYS; day++) {
    await runDay(day);
    if (day % 5 === 0) {
      console.log(`Dia ${day}/${DAYS} concluido`);
    }
  }

  const summary = buildSummary();
  console.log('SIMULATION_DONE');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error('SIMULATION_FAILED');
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
