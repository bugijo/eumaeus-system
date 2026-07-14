import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trackedOrCandidateFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: repositoryRoot },
).toString('utf8').split('\0').filter(Boolean);

const findings = [];
const addFinding = (file, line, rule) => findings.push({ file, line, rule });
const isPlaceholder = (value) => (
  /^(?:<|\$\{|process\.env|placeholder|example|exemplo|replace|change|your|seu|sua|senha|password|pass|postgres|test[_-])/i
    .test(value)
);
const isLocalHost = (hostname) => new Set(['localhost', '127.0.0.1', '[::1]']).has(hostname);

const sourceFiles = new Map();

for (const relativeFile of trackedOrCandidateFiles) {
  const absoluteFile = path.join(repositoryRoot, relativeFile);
  let fileStat;
  try {
    fileStat = statSync(absoluteFile);
  } catch {
    continue;
  }

  if (!fileStat.isFile()) {
    continue;
  }

  if (/\.(?:db|sqlite|sqlite3)(?:-(?:journal|shm|wal))?$/i.test(relativeFile)) {
    addFinding(relativeFile, 1, 'tracked-local-database');
  }

  if (fileStat.size > 2_000_000) {
    continue;
  }

  const buffer = readFileSync(absoluteFile);
  if (buffer.includes(0)) {
    continue;
  }

  const text = buffer.toString('utf8');
  sourceFiles.set(relativeFile, text);
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const postgresUrls = line.match(/postgres(?:ql)?:\/\/[^\s"'<>`]+/gi) || [];

    for (const candidate of postgresUrls) {
      const normalizedCandidate = candidate.replace(/[),.;]+$/, '');
      try {
        const parsed = new URL(normalizedCandidate);
        if (parsed.password && !isPlaceholder(parsed.password) && !isLocalHost(parsed.hostname)) {
          addFinding(relativeFile, index + 1, 'credentialed-remote-postgresql-url');
        }
      } catch {
        // Invalid examples are handled by runtime configuration validation.
      }
    }

    if (!relativeFile.includes('__tests__')) {
      const assignment = line.match(
        /\b(JWT_SECRET|REFRESH_TOKEN_SECRET|FOCUS_NFE_TOKEN)\b\s*(?:=|:)\s*["']?([^\s"'#]+)/,
      );
      if (assignment && assignment[2].length >= 24 && !isPlaceholder(assignment[2])) {
        addFinding(relativeFile, index + 1, 'literal-high-entropy-secret');
      }
    }
  }
}

const mutationScripts = [
  'create-test-data.cjs',
  'create-tutor-test.cjs',
  'fix-tutor-password.cjs',
  'migrate-auth-data.js',
  'prisma/seed.ts',
  'backend/prisma/seed.ts',
  'backend/prisma/simulate-30-days.ts',
  'backend/prisma/migrate-v2.ts',
  'backend/scripts/real-usage-simulation.mjs',
];

for (const relativeFile of mutationScripts) {
  const text = sourceFiles.get(relativeFile) || '';
  if (!text.includes('ALLOW_')) {
    addFinding(relativeFile, 1, 'missing-explicit-mutation-opt-in');
  }

  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/(?:password|senha)\s*[:=]\s*["'][^"']+["']/i.test(line)) {
      addFinding(relativeFile, index + 1, 'literal-password-in-mutation-script');
    }
  });
}

const runtimePrismaConstructors = [];
for (const [relativeFile, text] of sourceFiles.entries()) {
  if (!relativeFile.startsWith('backend/src/') || relativeFile.includes('/__tests__/')) {
    continue;
  }

  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes('new PrismaClient')) {
      runtimePrismaConstructors.push({ file: relativeFile, line: index + 1 });
    }
  });
}

if (
  runtimePrismaConstructors.length !== 1 ||
  runtimePrismaConstructors[0]?.file !== 'backend/src/lib/prisma.ts'
) {
  for (const constructor of runtimePrismaConstructors) {
    addFinding(constructor.file, constructor.line, 'non-central-runtime-prisma-client');
  }
  if (runtimePrismaConstructors.length === 0) {
    addFinding('backend/src/lib/prisma.ts', 1, 'missing-central-runtime-prisma-client');
  }
}

const renderBlueprint = sourceFiles.get('render.yaml') || '';
if (/plan:\s*free/.test(renderBlueprint) && /preDeployCommand:/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'free-render-service-cannot-use-predeploy');
}
if (!/buildCommand:[\s\S]*npm run db:migrate/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'render-build-does-not-apply-migrations');
}
if (!/autoDeployTrigger:\s*off/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'render-autodeploy-must-wait-for-baseline-audit');
}

if (findings.length > 0) {
  console.error('P0 policy check failed:');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}]`);
  }
  process.exit(1);
}

console.log(`P0 policy check passed (${trackedOrCandidateFiles.length} files inspected).`);
