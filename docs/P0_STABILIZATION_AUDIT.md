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

Resposta P0 no código: todos os valores foram substituídos por placeholders e a CI agora examina somente a árvore candidata, sem imprimir valores. O histórico continua contaminado e não é considerado saneado.

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
- `backend/scripts/real-usage-simulation.mjs:3,8-13,155-207` apontava por padrão para o Render, autenticava com credenciais conhecidas e criava dados; scripts legados da raiz também podiam criar/apagar perfis sem trava.
- `GUIA_DEPLOY_PRODUCAO.md:259`, `CHECKLIST_PRE_LANCAMENTO_V2.md:59` e `RESUMO_EXECUTIVO_V2.md:144` ainda orientavam ou afirmavam o uso de uma senha temporária compartilhada conhecida.

Impacto: contas privilegiadas conhecidas e mutação silenciosa de dados reais.

Correção P0: remover provisionamento do startup; scripts de seed/simulação recusam qualquer ambiente diferente de `development`/`test`, exigem opt-in e senha efêmera explícitos, sem default. O login de produção também recusa senhas legadas com menos de 12 caracteres, neutralizando as credenciais curtas que versões anteriores criavam. A orientação de senha compartilhada foi removida e os relatórios antigos agora são marcados explicitamente como evidência histórica não válida para deploy.

Gate operacional: perfis já existentes precisam ser inventariados em clone restaurado e receber rotação ou desativação controlada. A branch não altera contas reais automaticamente e não afirma que o incidente está encerrado sem essa verificação.

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

Correção P0 original: validação da aplicação e do schema acontece antes do `listen`; Render usa `/health` e `autoDeployTrigger` permanece desligado. A migration no build era uma compatibilidade temporária com o plano Free. Para produção paga, essa decisão foi substituída pelo `preDeployCommand` controlado descrito em `docs/PRODUCTION_READINESS_RUNBOOK.md`. O baseline de uma base existente continua sendo uma operação única e controlada, nunca uma correção automática destrutiva.

### P0.8 — health check e testes não provam prontidão

Evidências:

- `/health` e `/api/health` consultam o banco em `backend/src/server.ts:173-197`, mas `render.yaml` não define `healthCheckPath`;
- o mock em `backend/src/__tests__/setup.ts:5-48` não possui `$queryRaw`, enquanto `health.test.ts:6-25` espera 200;
- testes de tutores não enviam JWT, embora as rotas exijam RBAC;
- `backend/package.json` e `backend/package-lock.json` divergem, bloqueando `npm ci`;
- Vitest não exclui `backend/` e pode coletar suítes Jest;
- `.github/workflows/ci.yml` tem YAML inválido e não executa os gates obrigatórios.

Correção P0: health retorna componentes `application` e `database`, com 503 quando conexão ou schema oficial falham; startup também recusa PostgreSQL acessível sem `AuthProfile`; mocks cobrem sucesso/falha; suites ficam isoladas; lockfile e CI executam exatamente a matriz de aceitação.

### P0.9 — credenciais opcionais e erros externos em logs

Evidências:

- `backend/src/services/emailService.ts:33-38` carregava usuário/senha placeholder no transporte SMTP e usava `EMAIL_PASSWORD`, enquanto a configuração central esperava `EMAIL_PASS`;
- `backend/src/services/nfe.service.ts:86-123,294-296` anexava o token fiscal ao header Axios e registrava objetos de erro capazes de conter `Authorization`, URL e corpo da resposta.

Correção P0: e-mail fica explicitamente desabilitado sem o par `EMAIL_USER`/`EMAIL_PASSWORD`, sem criar transporte ou fallback; erros SMTP são genéricos. Erros Focus NFe são reduzidos a código/status controlados, e teste com marcador sintético prova que header, URL, corpo e token não chegam ao logger.

### P0.10 — dependências de produção vulneráveis

`npm audit --omit=dev` no snapshot auditado encontrou advisories altos corrigíveis em Axios, Express/transitivos, Nodemailer e React Router. As versões foram atualizadas de forma dirigida, sem `--force`, e os dois grafos de produção agora retornam zero vulnerabilidades conhecidas. A CI bloqueia novos advisories altos de produção.

## P1 — próxima branch recomendada

### Banco e migrações

- `prisma/schema.prisma` é SQLite e diverge do PostgreSQL oficial em `backend/prisma/schema.prisma`; há diferenças em Appointment, Tutor/AuthProfile, Prescription, ClinicSettings, enums e roles.
- A cadeia SQLite `prisma/migrations/20250707214459_add_auth_profile/migration.sql:4-50` não preserva usuários existentes e não deve ser executada sobre dados reais.
- O initializer PostgreSQL contém defaults com mojibake em `backend/prisma/migrations/init-postgres/migration.sql:170-177`; ele foi preservado byte a byte. A correção entrou em migração aditiva e transacional `backend/prisma/migrations/z_20260713000000_fix_clinic_settings_defaults/migration.sql:1-24`, que também alinha o índice implícito `_PermissionToRole` sem apagar dados.
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

- o plano PostgreSQL gratuito do Render expira, não possui backup gerenciado e não deve ser tratado como armazenamento de produção; mudança de plano exige autorização externa;
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

## Gates operacionais antes de merge ou deploy

Esta branch deve permanecer draft e não deve ser implantada até que um operador autorizado conclua os itens abaixo:

1. Rotacionar a senha PostgreSQL e os dois segredos JWT; revogar todos os refresh tokens existentes.
2. Auditar, em clone restaurado, contas criadas pelo bootstrap legado; rotacionar ou desativar as afetadas. O login novo bloqueia credenciais curtas conhecidas, mas não substitui o saneamento dos perfis.
3. Obter backup externo, restaurar em ambiente isolado e inspecionar `_prisma_migrations`. Se o banco existente veio de `db push`/SQL manual, fazer o baseline somente após diff zero e revisão humana.
4. Confirmar que o Render não fará deploy automático. O plano gratuito não suporta `preDeployCommand`; por isso a migração está no build e `autoDeployTrigger: off` até o baseline ser comprovado.
5. Tratar o diff da PR como parte do incidente: ao comparar com `main`, a interface do GitHub pode renderizar os valores antigos nas linhas removidas, embora o novo snapshot não os contenha. Rotacionar antes de compartilhar ou implantar.
6. Definir armazenamento PostgreSQL com retenção e backup adequados. O banco gratuito atual expira e não possui backup gerenciado.

O initializer `init-postgres` não pode ser renomeado enquanto o estado de produção for desconhecido. Até uma futura normalização ensaiada, novas migrações desta linhagem devem usar prefixo lexicograficamente posterior `z_<timestamp>` e continuar sendo testadas do zero na CI.

Referências operacionais: [deploy e limitação de pre-deploy do Render](https://render.com/docs/deploys), [limitações do plano gratuito](https://render.com/docs/free) e [baseline seguro do Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining).

## Resultado validado da implementação P0

Validação local executada em 2026-07-13, sem usar infraestrutura ou credenciais de produção:

| Área | Evidência executada | Resultado |
| --- | --- | --- |
| Frontend | `npm ci` | passou |
| Frontend | `npm run lint` | passou, 0 erros e 16 avisos legados |
| Frontend | `npm run build` | passou, 2.672 módulos |
| Frontend | `npm test -- --run` | 6 arquivos, 69 testes aprovados |
| Backend | `npm ci` | passou |
| Backend | `npm run prisma:validate` e `npm run prisma:generate` | schema válido; Prisma Client 5.22.0 gerado |
| Backend | `npm run build` | passou |
| Backend | `npm test` | 9 suítes, 47 testes aprovados |
| Banco | PostgreSQL 16 vazio + `prisma migrate deploy` | 2 migrações aplicadas; segunda execução sem pendências |
| Banco | `prisma migrate status` e `prisma migrate diff --exit-code` | atualizado; diff zero |
| Startup | variáveis ausentes | status 1; mensagem lista somente `DATABASE_URL`, `JWT_SECRET` e `REFRESH_TOKEN_SECRET` |
| Startup | banco acessível sem schema | status 1; mensagem segura de banco/schema não pronto |
| Startup | variáveis válidas + schema migrado | iniciou; `/health` retornou 200 com aplicação e banco `ok` |
| Cache | health, 401 e resposta autenticada 200 | `private, no-store` |
| Scripts | produção, staging/ausente e opt-in ausente | execução recusada antes de criar Prisma/conectar |
| Política | `npm run test:policy` | 430 arquivos; sem DB rastreado, senha padrão conhecida, segredo literal suspeito, Prisma runtime extra ou Render incompatível/não fail-fast |
| Dependências | `npm audit --omit=dev` | 0 vulnerabilidades nos grafos de produção frontend/backend |

O `npm ci` do frontend ainda reporta 7 advisories apenas em ferramentas de desenvolvimento (Cypress/Vite e transitivos); as correções disponíveis exigem upgrades major e ficam registradas como risco P1, sem `npm audit fix --force` nesta fase.
