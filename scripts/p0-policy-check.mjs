import { execFileSync } from 'node:child_process';
import { closeSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
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
const normalizePath = (value) => value.replaceAll('\\', '/');
const isPlaceholder = (value) => {
  const normalized = value.trim().replace(/^["'`]+|["'`,;]+$/g, '');
  return (
    normalized.length === 0 ||
    /^(?:<|\$|\{\{|\[|%|\*{3}|process\.env|import\.meta\.env|placeholder|example|exemplo|replace|change|dummy|redacted|your|seu|sua)/i
      .test(normalized)
  );
};
const isLocalHost = (hostname) => new Set(['localhost', '127.0.0.1', '[::1]']).has(hostname);
const legacyDefaultPasswordPattern = new RegExp(['mudar', '123'].join(''), 'i');
const privateKeyPattern = new RegExp([
  '-----BEGIN ',
  '(?:RSA |EC |OPENSSH |DSA )?',
  'PRIVATE KEY-----',
].join(''));
const providerTokenPatterns = [
  new RegExp(['gh', '[pousr]_', '[A-Za-z0-9_]{30,}'].join('')),
  new RegExp(['github', '_pat_', '[A-Za-z0-9_]{20,}'].join('')),
  new RegExp(['rnd', '_', '[A-Za-z0-9_-]{20,}'].join('')),
  new RegExp(['AK', 'IA', '[A-Z0-9]{16}'].join('')),
  new RegExp(['xox', '[abprs]-', '[A-Za-z0-9-]{20,}'].join('')),
  new RegExp(['glpat', '-', '[A-Za-z0-9_-]{20,}'].join('')),
  new RegExp(['npm', '_', '[A-Za-z0-9]{30,}'].join('')),
  new RegExp(['AIza', '[A-Za-z0-9_-]{30,}'].join('')),
  new RegExp(['sk', '-(?:proj-|svcacct-|live-)?', '[A-Za-z0-9_-]{24,}'].join('')),
];
const sensitiveEnvironmentNamePattern = /(?:^|_)(?:PASSWORD|PASSWD|PWD|SECRET|TOKEN|API_KEY|PRIVATE_KEY|CREDENTIALS?)(?:_|$)/;

const grandfatheredLegacySql = new Set([
  'prisma/migrations/20250707145650_init_local_sqlite/migration.sql',
  'prisma/migrations/20250707214459_add_auth_profile/migration.sql',
  'prisma/migrations/20250716001151_add_soft_delete/migration.sql',
  'prisma/migrations/20250723134757_add_nfe_id_to_invoice/migration.sql',
  'prisma/migrations/20250723220641_simplify_tutor_model/migration.sql',
  'prisma/migrations/20250724211745_add_prescription_models/migration.sql',
  'prisma/migrations/migration-script.sql',
  'prisma/migrations_backup/20250627174922_init_tutor_pet_models/migration.sql',
  'prisma/migrations_backup/20250627180416_add_appointment_record_service_models/migration.sql',
  'prisma/migrations_backup/20250703124806_add_user_auth_models/migration.sql',
]);

const isAllowedMigrationSql = (relativeFile, allowGrandfatheredLegacy) => {
  const normalized = normalizePath(relativeFile);
  return (
    /^backend\/prisma\/migrations\/[^/]+\/migration\.sql$/i.test(normalized) ||
    (allowGrandfatheredLegacy && grandfatheredLegacySql.has(normalized))
  );
};

const prohibitedArtifactRule = (relativeFile, allowGrandfatheredLegacy = true) => {
  const normalized = normalizePath(relativeFile);
  const basename = path.posix.basename(normalized);

  if (/\.env(?:\..+)?$/i.test(basename) && !/\.env(?:\..+)?\.example$/i.test(basename) && basename !== '.env.example') {
    return 'environment-file-must-not-be-committed';
  }

  if (
    normalized.startsWith('reports/private/') ||
    /(?:^|\/)[^/]*\.(?:credentials|secrets)\.[^/]+$/i.test(normalized) ||
    /_com_credenciais(?:\.|$)/i.test(normalized)
  ) {
    return 'credential-report-must-not-be-committed';
  }

  if (/\.(?:db|sqlite|sqlite3)(?:-(?:journal|shm|wal))?(?:\..+)?$/i.test(normalized)) {
    return 'local-database-artifact';
  }

  if (/\.(?:dump|backup)(?:\..+)?$/i.test(normalized)) {
    return 'database-dump-artifact';
  }

  if (/\.dir\.tar(?:\..+)?$/i.test(normalized)) {
    return 'database-export-archive';
  }

  if (/\.sql(?:\..+)?$/i.test(normalized) && !isAllowedMigrationSql(normalized, allowGrandfatheredLegacy)) {
    return 'sql-outside-official-migrations';
  }

  return null;
};

const headerFor = (absoluteFile, length = 16) => {
  const descriptor = openSync(absoluteFile, 'r');
  try {
    const header = Buffer.alloc(length);
    const bytesRead = readSync(descriptor, header, 0, length, 0);
    return header.subarray(0, bytesRead);
  } finally {
    closeSync(descriptor);
  }
};

const contentArtifactRule = (header) => {
  if (header.subarray(0, 16).equals(Buffer.from([...Buffer.from('SQLite format 3'), 0]))) {
    return 'sqlite-content-with-disguised-extension';
  }
  if (header.subarray(0, 5).toString('ascii') === 'PGDMP') {
    return 'postgres-dump-with-disguised-extension';
  }
  return null;
};

const secretRulesForLine = (line) => {
  const rules = [];
  if (privateKeyPattern.test(line)) {
    rules.push('private-key-material');
  }
  if (providerTokenPatterns.some((pattern) => pattern.test(line))) {
    rules.push('provider-access-token');
  }
  return rules;
};

const literalSensitiveAssignment = (line) => {
  const assignment = line.match(
    /\b([A-Z][A-Z0-9_]{2,})\b\s*(?:=|:)\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s#;,]+))/,
  );
  if (!assignment || !sensitiveEnvironmentNamePattern.test(assignment[1])) {
    return false;
  }

  const value = assignment[2] ?? assignment[3] ?? assignment[4] ?? assignment[5] ?? '';
  return value.trim().length >= 12 && !isPlaceholder(value);
};

const scanTextForSensitiveMaterial = (label, relativeFile, text, suffix = '') => {
  const lines = text.split(/\r?\n/);
  const genericAssignmentsAllowed = !relativeFile.includes('__tests__');

  lines.forEach((line, index) => {
    if (legacyDefaultPasswordPattern.test(line)) {
      addFinding(label, index + 1, `known-default-password${suffix}`);
    }

    const postgresUrls = line.match(/postgres(?:ql)?:\/\/[^\s"'<>`]+/gi) || [];
    for (const candidate of postgresUrls) {
      const normalizedCandidate = candidate.replace(/[),.;]+$/, '');
      try {
        const parsed = new URL(normalizedCandidate);
        if (parsed.password && !isPlaceholder(parsed.password) && !isLocalHost(parsed.hostname)) {
          addFinding(label, index + 1, `credentialed-remote-postgresql-url${suffix}`);
        }
      } catch {
        // Invalid examples are rejected by runtime configuration where applicable.
      }
    }

    if (genericAssignmentsAllowed && literalSensitiveAssignment(line)) {
      addFinding(label, index + 1, `literal-sensitive-environment-value${suffix}`);
    }

    if (genericAssignmentsAllowed) {
      const keyBlock = line.match(/^\s*-?\s*key\s*:\s*["']?([A-Z][A-Z0-9_]{2,})["']?\s*$/);
      if (keyBlock && sensitiveEnvironmentNamePattern.test(keyBlock[1])) {
        for (let nextIndex = index + 1; nextIndex < Math.min(index + 5, lines.length); nextIndex += 1) {
          if (/^\s*-\s*key\s*:/.test(lines[nextIndex])) {
            break;
          }
          const valueLine = lines[nextIndex].match(
            /^\s*value\s*:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s#;,]+))/,
          );
          if (valueLine) {
            const value = valueLine[1] ?? valueLine[2] ?? valueLine[3] ?? valueLine[4] ?? '';
            if (value.trim().length >= 12 && !isPlaceholder(value)) {
              addFinding(label, nextIndex + 1, `literal-sensitive-key-value-block${suffix}`);
            }
            break;
          }
        }
      }
    }

    for (const rule of secretRulesForLine(line)) {
      addFinding(label, index + 1, `${rule}${suffix}`);
    }
  });
};

const scanCommittedText = (label, relativeFile, text) => {
  scanTextForSensitiveMaterial(label, relativeFile, text, '-in-new-commit');
};

const scanNewCommitRange = () => {
  const base = process.env.POLICY_BASE_SHA?.trim();
  const head = process.env.POLICY_HEAD_SHA?.trim();

  if (!base || !head || /^0+$/.test(base) || base === head) {
    return 0;
  }

  try {
    execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { cwd: repositoryRoot });
    execFileSync('git', ['cat-file', '-e', `${head}^{commit}`], { cwd: repositoryRoot });
  } catch {
    addFinding('.github/workflows/ci.yml', 1, 'policy-commit-range-is-not-available');
    return 0;
  }

  const commits = execFileSync('git', ['rev-list', '--reverse', `${base}..${head}`], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);

  let blobsInspected = 0;
  for (const commit of commits) {
    const changedFiles = execFileSync(
      'git',
      ['diff-tree', '--no-commit-id', '--name-only', '--diff-filter=AM', '-r', '-z', commit],
      { cwd: repositoryRoot },
    ).toString('utf8').split('\0').filter(Boolean);

    for (const relativeFile of changedFiles) {
      let buffer;
      try {
        buffer = execFileSync('git', ['show', `${commit}:${relativeFile}`], {
          cwd: repositoryRoot,
          maxBuffer: 50 * 1024 * 1024,
        });
      } catch {
        addFinding(relativeFile, 1, 'policy-could-not-read-new-commit-blob');
        continue;
      }

      blobsInspected += 1;
      const label = `${commit.slice(0, 12)}:${relativeFile}`;
      const pathRule = prohibitedArtifactRule(relativeFile, false);
      if (pathRule) {
        addFinding(label, 1, `${pathRule}-in-new-commit`);
      }

      const contentRule = contentArtifactRule(buffer.subarray(0, 16));
      if (contentRule) {
        addFinding(label, 1, `${contentRule}-in-new-commit`);
      }

      if (!buffer.subarray(0, 8192).includes(0)) {
        scanCommittedText(label, relativeFile, buffer.toString('utf8'));
      }
    }
  }

  return blobsInspected;
};

const runPolicySelfTest = () => {
  const rejectedPaths = [
    'sample.db',
    'sample.db.gz',
    'sample.sqlite3-wal',
    'backup.dump',
    'backup.backup.gz',
    'eumaeus-production.dir.tar.gz',
    'snapshot.sql',
    'snapshot.sql.gz',
    '.env.staging',
    'backend/.env.production.local',
    'reports/private/production.md',
    'audit.credentials.json',
  ];
  const allowedPaths = [
    '.env.example',
    'backend/.env.production.example',
    'backend/prisma/migrations/20260716000000_example/migration.sql',
  ];

  if (rejectedPaths.some((candidate) => prohibitedArtifactRule(candidate) === null)) {
    throw new Error('Repository policy self-test failed for a prohibited path');
  }
  if (allowedPaths.some((candidate) => prohibitedArtifactRule(candidate) !== null)) {
    throw new Error('Repository policy self-test failed for an allowed path');
  }
  if (contentArtifactRule(Buffer.from([...Buffer.from('SQLite format 3'), 0])) === null) {
    throw new Error('Repository policy self-test failed for SQLite content');
  }
  if (contentArtifactRule(Buffer.from('PGDMP')) === null) {
    throw new Error('Repository policy self-test failed for PostgreSQL dump content');
  }

  const generatedProviderTokens = [
    ['gh', 'p_', 'A'.repeat(40)].join(''),
    ['github', '_pat_', 'B'.repeat(40)].join(''),
    ['rnd', '_', 'C'.repeat(32)].join(''),
  ];
  if (generatedProviderTokens.some(
    (token) => !secretRulesForLine(token).includes('provider-access-token'),
  )) {
    throw new Error('Repository policy self-test failed for provider tokens');
  }

  const generatedAssignments = [
    ['INITIAL_OWNER', '_PASSWORD=', 'D'.repeat(24)].join(''),
    ['INITIAL_OWNER', '_PASSWORD=', ['Pass', 'wordSuperSecret2026!'].join('')].join(''),
  ];
  if (generatedAssignments.some((assignment) => !literalSensitiveAssignment(assignment))) {
    throw new Error('Repository policy self-test failed for generic sensitive assignments');
  }

  const findingsBeforeKeyValueTest = findings.length;
  const generatedKeyValueBlock = [
    ['- key: EMAIL', '_PASSWORD'].join(''),
    ['  value: ', 'E'.repeat(24)].join(''),
  ].join('\n');
  scanTextForSensitiveMaterial('self-test', 'render-fixture.yml', generatedKeyValueBlock);
  if (!findings.some((finding, index) => (
    index >= findingsBeforeKeyValueTest && finding.rule === 'literal-sensitive-key-value-block'
  ))) {
    throw new Error('Repository policy self-test failed for sensitive YAML key/value blocks');
  }
  findings.splice(findingsBeforeKeyValueTest);
};

runPolicySelfTest();
const committedBlobsInspected = scanNewCommitRange();

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

  const pathRule = prohibitedArtifactRule(relativeFile);
  if (pathRule) {
    addFinding(relativeFile, 1, pathRule);
  }

  const header = headerFor(absoluteFile);
  const contentRule = contentArtifactRule(header);
  if (contentRule) {
    addFinding(relativeFile, 1, contentRule);
  }

  if (header.includes(0)) {
    continue;
  }

  const buffer = readFileSync(absoluteFile);
  if (buffer.includes(0)) {
    continue;
  }

  const text = buffer.toString('utf8');
  sourceFiles.set(relativeFile, text);
  scanTextForSensitiveMaterial(relativeFile, relativeFile, text, '-in-snapshot');
}

const mutationScripts = [
  'create-test-data.cjs',
  'add-test-data.cjs',
  'create-tutor-test.cjs',
  'fix-tutor-password.cjs',
  'migrate-auth-data.js',
  'test-bcrypt.cjs',
  'test-backend-tutor.cjs',
  'verify-tutor.cjs',
  'prisma/seed.ts',
  'prisma/seedProducts.ts',
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

  text.split(/\r?\n/).forEach((line, index) => {
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
const buildCommand = renderBlueprint.match(/^\s*buildCommand:\s*(.+)$/m)?.[1] || '';
const requiredUnsyncedEnvironment = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

if (/^databases:/m.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'production-database-must-not-be-created-by-blueprint');
}
if (/plan:\s*free/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'production-service-must-not-use-free-plan');
}
if (!/plan:\s*starter/.test(renderBlueprint) || !/region:\s*oregon/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'production-service-plan-or-region-is-not-explicit');
}
if (!buildCommand.includes('npm ci') || !buildCommand.includes('prisma:generate') || !buildCommand.includes('npm run build')) {
  addFinding('render.yaml', 1, 'render-build-command-is-incomplete');
}
if (buildCommand.includes('db:migrate') || buildCommand.includes('migrate deploy')) {
  addFinding('render.yaml', 1, 'render-build-must-not-mutate-database');
}
if (!/preDeployCommand:\s*npm run db:migrate/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'paid-render-service-must-use-predeploy-migrations');
}
if (!/healthCheckPath:\s*\/health/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'render-health-check-must-use-health-endpoint');
}
if (!/autoDeployTrigger:\s*off/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'render-autodeploy-must-remain-off');
}
if (/fromDatabase:|generateValue:/.test(renderBlueprint)) {
  addFinding('render.yaml', 1, 'production-secrets-must-be-manually-provisioned');
}
for (const variable of requiredUnsyncedEnvironment) {
  const escaped = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const variableBlock = new RegExp(`- key: ${escaped}\\s+sync: false`);
  if (!variableBlock.test(renderBlueprint)) {
    addFinding('render.yaml', 1, `render-${variable.toLowerCase()}-must-remain-unsynced`);
  }
}

if (findings.length > 0) {
  console.error('Repository policy check failed:');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}]`);
  }
  process.exit(1);
}

console.log(
  `Repository policy check passed (${trackedOrCandidateFiles.length} files and ${committedBlobsInspected} new commit blobs inspected; in-memory negative cases passed).`,
);
