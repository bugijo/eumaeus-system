# Auditoria de estabilização P0

Data da auditoria: 2026-07-13
Base auditada: `2cf5a767b6a04a10325bbb99b392205420e2df3a`

Este relatório consolida cinco auditorias independentes e somente de leitura: backend, banco de dados, segurança, frontend e testes/deploy. Os relatórios históricos do repositório não foram usados como evidência de sucesso; os critérios serão validados novamente na branch `codex/eumaeus-p0-stabilization`.

## Escopo desta branch

Esta fase corrige somente a fundação P0:

- configuração obrigatória e falha rápida do backend;
- remoção de fallbacks de segredos;
- remoção de bootstrap automático de contas e produtos demonstrativos;
- cache privado e `no-store` para APIs;
- uma única instância de Prisma no runtime;
- inicialização e health check determinísticos;
- saneamento do snapshot versionado e proteção contra nova inclusão de bancos locais;
- isolamento e reparo dos gates de CI/testes;
- validação das migrações em PostgreSQL descartável.

Não fazem parte desta branch: multi-tenant, redesign, novas funcionalidades comerciais, remoção de migrações legadas ou alteração destrutiva de dados de produção.

## P0 — críticos

### P0.1 — credenciais de produção no histórico e no snapshot

Evidências no commit auditado, sem reproduzir valores:

- URL PostgreSQL com credencial em `ALTERNATIVAS_BACKUP_SEM_POSTGRESQL.md:46,65,108,126,192,247`, `BACKUP_RENDER_INSTRUCOES.md:39,146,154`, `CONFIGURACAO_VARIAVEIS_PRODUCAO.md:21`, `INSTALACAO_POSTGRESQL.md:153` e `INSTRUCOES_RENDER.md:15`;
- segredos JWT literais em `CONFIGURACAO_VARIAVEIS_PRODUCAO.md:26-27`.

Impacto: acesso direto ao banco e possibilidade de assinatura de tokens fora da aplicação. A remoção no novo snapshot não revoga os valores nem remove os blobs de commits antigos.

Resposta P0 no código: substituir todos os valores por placeholders e adicionar varredura no CI.

Ação operacional obrigatória, fora desta PR: rotacionar a senha do PostgreSQL e os dois segredos JWT, revogar refresh tokens e verificar logs de acesso. Nenhum valor antigo ou novo deve ser copiado para issue, PR, commit, log ou documentação.

### P0.2 — bancos SQLite rastreados com dados potencialmente sensíveis

Evidências binárias:

- `prisma/dev.db` contém registros de tutores, pets, agendamentos, prontuários, perfis de autenticação, hashes e refresh tokens;
- `backend/prisma/dev.db` e `backend/prisma/prisma/dev.db` também contêm dados pessoais/autenticação;
- `.gitignore:27-29,58-61` não impede de forma abrangente arquivos `*.db` e não remove arquivos que já estejam rastreados.

Até que o proprietário confirme a proveniência, os snapshots devem ser tratados como dados sensíveis.

#### Estratégia segura antes da remoção do snapshot

1. Confirmar que o Render usa exclusivamente PostgreSQL e que nenhum dos três arquivos é banco de produção.
2. Se houver obrigação de retenção, criar uma cópia criptografada fora do Git, registrar checksum, custodiante e prazo de retenção.
3. Rotacionar credenciais, redefinir contas potencialmente afetadas e invalidar refresh tokens.
4. Remover os arquivos apenas do snapshot versionado e ampliar o ignore; não apagar bancos de runtime nem migrações.
5. Em operação posterior e coordenada, congelar pushes, fazer backup de todas as refs, reescrever o histórico com `git filter-repo` ou equivalente, verificar todas as refs/tags, force-push anunciado e exigir novos clones.

Esta estratégia é registrada antes do commit que removerá os três arquivos da árvore da branch. A remoção da árvore não será apresentada como limpeza do histórico.

### P0.3 — segredos JWT conhecidos e configuração divergente

Evidências:

- fallbacks em `backend/src/controllers/authController.ts:8-9`, `backend/src/middlewares/auth.middleware.ts:4` e `backend/src/config/env.ts:18-20`;
- `backend/.env.example:5-6` usa nome diferente do runtime para o segredo de refresh;
- `render.yaml:16-22` não declara os segredos exigidos.

Impacto: um atacante pode forjar token de `DONO`; configuração ausente não falha de forma clara.

Correção P0: fonte única de configuração, `DATABASE_URL`, `JWT_SECRET` e `REFRESH_TOKEN_SECRET` obrigatórios, fortes, distintos e sem placeholders; falha antes de importar o servidor, sem imprimir valores.

### P0.4 — criação automática de contas e catálogo demonstrativo

Evidências:

- e-mails e senhas previsíveis em `backend/src/server.ts:24-31`;
- criação de roles/perfis/usuários em `backend/src/server.ts:239-292`;
- criação de produtos em `backend/src/server.ts:294-320`;
- execução em todo ambiente não teste em `backend/src/server.ts:329-330`;
- scripts auxiliares com senhas conhecidas em `backend/prisma/seed.ts:25-66`, `backend/prisma/simulate-30-days.ts:6-20,93-123` e `backend/prisma/migrate-v2.ts:36-43,96-102`.

Impacto: contas privilegiadas conhecidas e mutação silenciosa de dados reais.

Correção P0: remover provisionamento do startup; scripts de seed/simulação devem recusar produção e exigir senha efêmera explícita, sem default.

### P0.5 — cache público de respostas autenticadas

Evidências:

- `backend/src/server.ts:41-54` marca dashboard como público por 5 minutos e toda outra API como pública por 1 minuto;
- isso inclui tutores, prontuários e financeiro (`backend/src/routes/tutor.routes.ts:8-16`, `backend/src/routes/medicalRecordRoutes.ts:13-26`, `backend/src/routes/invoice.routes.ts:9-39`);
- `public/sw.js:31-47,197-217,223-247` possui caminhos legados que armazenam APIs na Cache API.

Impacto: PII, dados clínicos, faturas e tokens podem permanecer em caches compartilhados ou locais.

Correção P0: toda `/api` recebe `Cache-Control: private, no-store`; health também recebe `no-store`; o service worker nunca armazena `/api` e remove caches legados.

### P0.6 — múltiplos pools Prisma no mesmo processo

Evidências:

- singleton pretendido em `backend/src/lib/prisma.ts:13-24`;
- instâncias independentes em `backend/src/controllers/authController.ts:3-7`, `dashboardController.ts:2-4`, `portal.controller.ts:2-7` e em serviços de appointment, clinic settings, invoice, medical record, pet, prescription, product e reminder.

Impacto: esgotamento de conexões PostgreSQL e instabilidade, especialmente no plano pequeno do Render.

Correção P0: todos os módulos de runtime importam exclusivamente `src/lib/prisma.ts`. Processos CLI independentes podem criar e desconectar sua própria instância.

### P0.7 — causa reproduzível de encerramento com status 1

Evidências:

- `backend/package.json:9` executa `prisma migrate deploy` antes do Node;
- o primeiro log da aplicação só ocorre em `backend/src/bootstrap.ts:3`;
- a linhagem PostgreSQL possui somente o initializer integral `backend/prisma/migrations/init-postgres/migration.sql`;
- um banco existente criado por `db push`, SQL manual ou migração com outro nome não possui o baseline `init-postgres`; o deploy tenta recriar tabelas e termina antes do bootstrap.

Também são reproduzíveis: `DATABASE_URL` ausente/inválida, banco indisponível e migração previamente falhada. Sem logs do último deploy e leitura de `_prisma_migrations`, não é possível afirmar qual cenário ocorreu em produção.

Correção P0 de processo: validação da aplicação acontece antes do `listen`; migração é uma etapa explícita de deploy, não um efeito colateral de cada restart; Render usa `/health`. O baseline de uma base existente é uma operação única e controlada, descrita abaixo, não uma correção automática destrutiva.

### P0.8 — health check e testes não provam prontidão

Evidências:

- `/health` e `/api/health` consultam o banco em `backend/src/server.ts:173-197`, mas `render.yaml` não define `healthCheckPath`;
- o mock em `backend/src/__tests__/setup.ts:5-48` não possui `$queryRaw`, enquanto `health.test.ts:6-25` espera 200;
- testes de tutores não enviam JWT, embora as rotas exijam RBAC;
- `backend/package.json` e `backend/package-lock.json` divergem, bloqueando `npm ci`;
- Vitest não exclui `backend/` e pode coletar suítes Jest;
- `.github/workflows/ci.yml` tem YAML inválido e não executa os gates obrigatórios.

Correção P0: health retorna componentes `application` e `database`, com 503 quando o banco falha; mocks cobrem sucesso/falha; suites ficam isoladas; lockfile e CI executam exatamente a matriz de aceitação.

## P1 — próxima branch recomendada

### Banco e migrações

- `prisma/schema.prisma` é SQLite e diverge do PostgreSQL oficial em `backend/prisma/schema.prisma`; há diferenças em Appointment, Tutor/AuthProfile, Prescription, ClinicSettings, enums e roles.
- A cadeia SQLite `prisma/migrations/20250707214459_add_auth_profile/migration.sql:4-50` não preserva usuários existentes e não deve ser executada sobre dados reais.
- O initializer PostgreSQL contém defaults com mojibake em `backend/prisma/migrations/init-postgres/migration.sql:170-177`; não editar uma migração possivelmente aplicada. Corrigir por migração aditiva depois de verificar o checksum/estado.
- Prescription existe só no schema SQLite; o serviço PostgreSQL está explicitamente desativado em `backend/src/services/prescription.service.ts:6-30`.

Fonte oficial definida para evolução: `backend/prisma/schema.prisma` e `backend/prisma/migrations/`, com PostgreSQL. O diretório `prisma/` da raiz permanece legado nesta fase e não será apagado sem preservação/classificação.

### Frontend e contratos

- mutações possuem retries em duas camadas (`src/api/apiClient.ts:92-94,333-385`; `src/providers/QueryProvider.tsx:35-44`), com risco de duplicação;
- logout deixa tokens/cache entre sessões (`src/api/apiClient.ts:451-528`, `src/components/layout/Layout.tsx:46-49`, `src/providers/QueryProvider.tsx:12-16`);
- calendário, status de agendamento, prontuário e dashboard possuem contratos incompatíveis entre frontend e backend;
- a rota pública de impressão e telas clínicas/financeiras usam dados demonstrativos como se fossem reais (`src/App.tsx:170-171`, `src/pages/ReceitaPrintPage.tsx:52-109`, `src/pages/ProntuarioPet.tsx:45-83`, `src/pages/Financeiro.tsx:38-72`). Devem ser desabilitadas ou ligadas a dados reais/autorizados antes de produção.
- rotas duplicadas/mortas e endpoints inexistentes permanecem para uma branch de contratos, sem redesign.

### Backend e segurança

- rate limiter pode ser contornado variando Bearer falso/X-Forwarded-For (`backend/src/server.ts:69-80`);
- logs incluem payloads/PII em serviços de agendamento, pet, lembretes e NFS-e;
- tratamento de erros é inconsistente e pode devolver detalhes internos;
- refresh token permanece em localStorage e em texto reversível no banco;
- dashboard expõe campos financeiros a papéis operacionais;
- transações, disponibilidade e status de agendamento possuem falhas de integridade.

### Operação

- o plano PostgreSQL gratuito do Render não oferece a durabilidade/backups esperados de produção; mudança de plano exige autorização externa;
- Node não está fixado de forma uniforme;
- previews Vercel apontam para o backend de produção;
- Cypress atual depende de backend externo, não autentica e usa contratos obsoletos; não será usado como gate até ficar efêmero e isolado.

## P2 — dívida planejada

- consolidar rotas/controladores duplicados de prontuário e portal morto;
- shutdown gracioso e rate limiting compartilhado;
- CSP/Helmet, CORS centralizado e auditoria de mutações clínicas/financeiras;
- `Decimal` para valores monetários, constraints de domínio e índices;
- endurecer TypeScript/ESLint e remover configurações/artefatos mortos;
- desenhar multi-tenant somente em fase própria; esta branch mantém o sistema explicitamente single-clinic.

## Estratégia segura para produção e rollback

1. Rotacionar credenciais e obter backup/PITR antes de qualquer operação de schema.
2. Restaurar o backup em PostgreSQL isolado.
3. Consultar `_prisma_migrations`, `information_schema`, constraints, índices e defaults no clone.
4. Se `init-postgres` já estiver aplicada, preservar o arquivo byte a byte e criar apenas migrações forward-only.
5. Se a base veio de `db push` e não possui histórico, comparar o schema restaurado com a fonte oficial. Somente com diff revisado e compatível marcar o initializer como aplicado usando `prisma migrate resolve --applied init-postgres`.
6. Se houver drift ou migração falhada, corrigir e ensaiar no clone; nunca executar `migrate reset`, `db push`, DROP ou `resolve` por tentativa em produção.
7. Validar `migrate deploy` duas vezes em PostgreSQL vazio e uma vez no clone restaurado.

Rollback da aplicação: reverter os commits da branch e redeployar o artefato anterior. Migrações forward-only não serão revertidas automaticamente; qualquer rollback de banco exige backup restaurado ou migração compensatória revisada.

## Matriz de aceitação P0

Frontend:

```bash
npm ci
npm run lint
npm run build
npm test -- --run
```

Backend:

```bash
cd backend
npm ci
npm run prisma:generate
npm run build
npm test
```

Banco/startup:

- aplicar e reaplicar `prisma migrate deploy` em PostgreSQL 16 vazio;
- confirmar `prisma migrate status` e diff zero entre banco e schema oficial;
- iniciar com variáveis efêmeras válidas e verificar `/health`;
- remover cada variável obrigatória e confirmar saída rápida com status 1 e mensagem contendo somente os nomes ausentes.

Nenhum comando de validação usará a URL encontrada no histórico ou qualquer banco de produção.
