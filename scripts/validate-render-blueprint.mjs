import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blueprintPath = path.join(repositoryRoot, 'render.yaml');
const blueprint = YAML.parse(readFileSync(blueprintPath, 'utf8'));
const errors = [];

const assert = (condition, message) => {
  if (!condition) {
    errors.push(message);
  }
};

assert(blueprint && typeof blueprint === 'object', 'render.yaml deve conter um objeto YAML');
assert(!Object.hasOwn(blueprint || {}, 'databases'), 'o Blueprint de produção não pode declarar bancos');
assert(Array.isArray(blueprint?.services), 'services deve ser uma lista');
assert(blueprint?.services?.length === 1, 'o Blueprint deve declarar somente o backend de produção');

const service = blueprint?.services?.[0] || {};
assert(service.type === 'web', 'o serviço deve ser web');
assert(service.name === 'Eumaeus-backend-oregon', 'o nome deve identificar o backend de produção existente');
assert(service.runtime === 'node', 'o runtime deve ser node');
assert(service.plan === 'starter', 'produção requer plano starter compatível com pre-deploy');
assert(service.region === 'oregon', 'a região de produção deve permanecer explícita como oregon');
assert(service.rootDir === 'backend', 'rootDir deve ser backend');
assert(service.autoDeployTrigger === 'off', 'autoDeployTrigger deve permanecer off');
assert(service.healthCheckPath === '/health', 'healthCheckPath deve ser /health');
assert(service.preDeployCommand === 'npm run db:migrate', 'migrations devem executar no pre-deploy');
assert(
  service.buildCommand === 'npm ci --include=dev && npm run prisma:generate && npm run build',
  'buildCommand deve ser determinístico e não pode executar migrations',
);

const environment = new Map((service.envVars || []).map((entry) => [entry.key, entry]));
for (const key of ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET']) {
  const entry = environment.get(key);
  assert(entry?.sync === false, `${key} deve ser configurada manualmente com sync: false`);
  assert(!Object.hasOwn(entry || {}, 'value'), `${key} não pode conter valor no Blueprint`);
  assert(!Object.hasOwn(entry || {}, 'generateValue'), `${key} não pode ser gerada pelo Blueprint`);
  assert(!Object.hasOwn(entry || {}, 'fromDatabase'), `${key} não pode criar ou vincular banco pelo Blueprint`);
}

assert(environment.get('NODE_ENV')?.value === 'production', 'NODE_ENV deve ser production');
assert(
  environment.get('ALLOW_TEST_DATA_MUTATION')?.value === 'false',
  'ALLOW_TEST_DATA_MUTATION deve permanecer false',
);

if (errors.length > 0) {
  console.error('render.yaml inválido para produção:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('render.yaml válido: produção paga, manual, sem banco ou segredos declarados.');
