# Runbook de prontidão para produção

Data-base dos preços e decisões: 16 de julho de 2026.

Este documento prepara a operação, mas **não autoriza contratação, merge,
sincronização de Blueprint ou deploy**.

## Estado dos dados legados

O gate forense foi encerrado como **DADOS SINTÉTICOS CONFIRMADOS — NÃO MIGRAR
PARA PRODUÇÃO**. Consulte `docs/FORENSIC_DATA_CLOSURE.md`.

A produção deve começar com PostgreSQL novo e vazio. Não restaurar SQLite, não
executar os seeds de demonstração e não usar scripts legados de migração de
usuários.

## Opções de infraestrutura

Conversão usada: USD 1 ≈ R$ 5,0739, PTAX de 14/07/2026. Os valores em reais são
aproximados e não incluem IOF, impostos ou variação cambial.

| Opção | Custo mensal estimado | Expiração, sleep e backup | Adequação |
| --- | ---: | --- | --- |
| A — staging Render Free | US$ 0 / R$ 0 | Web service dorme após 15 minutos. PostgreSQL Free expira em 30 dias e pode ser removido 14 dias depois. Sem backup gerenciado. | Somente testes temporários; risco crítico de perda de dados. |
| B — Render pago completo | US$ 13,30–14,50 / R$ 67,48–73,57 | Backend Starter sem sleep; PostgreSQL Basic-256mb; PITR de 3 dias no workspace Hobby. | Menor complexidade e conexão privada entre backend e banco. |
| C — Render Starter + Neon Launch | Aproximadamente US$ 8–22+ / R$ 40,59–111,63+, conforme uso | Backend sem sleep; banco pode escalar a zero; restore/time travel de até 7 dias. | Custo variável, dois provedores, conexão pública TLS e possível cold start. |

Detalhes da opção B:

- Backend Render Starter: US$ 7/mês.
- PostgreSQL Basic-256mb: US$ 6/mês.
- Armazenamento: US$ 0,30/GB/mês.
- Total com 1 GB: aproximadamente US$ 13,30/mês.
- Total com 5 GB: aproximadamente US$ 14,50/mês.
- Basic-256mb possui 0,1 CPU, 256 MB de memória, até 100 conexões e não tem HA.
- Backups lógicos externos com retenção mínima de 30 dias continuam necessários;
  armazenamento e automação desse backup não estão incluídos nos totais porque
  dependem do provedor e da retenção que ainda precisam de aprovação.

Fontes oficiais:

- Render: https://render.com/pricing
- Limitações Free: https://render.com/docs/free
- Backups PostgreSQL: https://render.com/docs/postgresql-backups
- Conectividade interna: https://render.com/docs/postgresql-creating-connecting
- Neon: https://neon.com/pricing
- Scale-to-zero Neon: https://neon.com/docs/introduction/scale-to-zero

### Recomendação atual

Usar a opção **B — Render Starter + PostgreSQL Basic-256mb em Oregon**, começando
com 1 GB ou 5 GB. É a alternativa mais previsível e reduz a superfície
operacional ao manter aplicação e banco no mesmo provedor e região.

O plano é adequado apenas para tráfego inicial baixo. CPU, memória, conexões,
latência e crescimento do banco devem ser monitorados. Nenhum recurso pago deve
ser criado sem confirmação explícita do proprietário.

## Controles do Blueprint

O `render.yaml` é exclusivo para produção:

- não declara `databases:`;
- não cria nem vincula PostgreSQL;
- usa web service `starter` em `oregon`;
- mantém `autoDeployTrigger: off`;
- não executa migration durante o build;
- usa `preDeployCommand: npm run db:migrate`;
- configura health check em `/health`;
- mantém `DATABASE_URL`, `JWT_SECRET` e `REFRESH_TOKEN_SECRET` como `sync: false`;
- não contém valores secretos;
- mantém `ALLOW_TEST_DATA_MUTATION=false`.

`autoDeployTrigger: off` não desliga a sincronização automática do Blueprint.
Antes de qualquer merge futuro, confirmar no Render:

1. No serviço `Eumaeus-backend-oregon`, desligar o auto-deploy atualmente
   ligado à branch `main`.
2. Blueprint Settings → Auto Sync → **No**.
3. Nenhuma alteração pendente para staging.
4. Nenhum banco a ser criado pelo plano do Blueprint.
5. Sincronização futura exclusivamente manual e após aprovação do custo.

Uma consulta somente leitura em 16/07/2026 confirmou que produção ainda usa
`autoDeploy=YES`, trigger por commit e branch `main`. Staging permanece ligado
à branch P1 com auto-deploy desligado. Assim, pushes desta branch de prontidão
não fazem deploy, mas qualquer merge futuro em `main` faria deploy automático
se esse gate não for cumprido antes.

Documentação oficial: https://render.com/docs/infrastructure-as-code

## Gates para o PostgreSQL novo

Somente após aprovação de custo:

1. Criar manualmente o PostgreSQL pago em Oregon.
2. Desabilitar acesso externo quando não for necessário.
3. Guardar a URL interna apenas no cofre de variáveis do Render.
4. Gerar `JWT_SECRET` e `REFRESH_TOKEN_SECRET` fortes e diferentes.
5. Confirmar backup/PITR e preparar backup lógico externo.
6. Aplicar `npm run db:migrate` por pre-deploy controlado.
7. Executar `npm run db:status` para conferir o histórico e, separadamente,
   verificar ausência de drift com:

   ```bash
   npx prisma migrate diff \
     --from-schema-datasource prisma/schema.prisma \
     --to-schema-datamodel prisma/schema.prisma \
     --exit-code
   ```
8. Confirmar que não existem usuários, tutores, pets, agenda, prontuários,
   produtos ou faturas.
9. Provisionar o primeiro `DONO` manualmente.

Nunca executar `prisma migrate reset`, seed, simulação ou restauração dos
SQLite legados.

## Provisionamento manual do primeiro `DONO`

O comando não é chamado pelo startup. Ele exige PostgreSQL, segredos válidos,
confirmação explícita e dados fornecidos manualmente.

Proteções implementadas:

- senha sem fallback, com 16 a 72 bytes e requisitos de complexidade;
- senha recebida somente por variável de ambiente, nunca por argumento;
- bcrypt com custo 12;
- transação `Serializable` com advisory lock PostgreSQL;
- recusa se existir qualquer `DONO`, identidade, configuração ou entidade de
  negócio no banco que deveria estar vazio;
- criação apenas do papel `DONO`, do perfil e do usuário inicial;
- `refreshToken` explicitamente nulo;
- nenhuma identidade, senha, hash ou URL é registrada;
- não existe opção genérica de override; a segunda execução sempre é recusada.

Após build aprovado, em shell privado e sem gravação de sessão:

```bash
cd backend

read -r -p 'Nome do responsável: ' INITIAL_OWNER_NAME
read -r -p 'E-mail do responsável: ' INITIAL_OWNER_EMAIL
read -r -s -p 'Senha inicial forte: ' INITIAL_OWNER_PASSWORD

export INITIAL_OWNER_NAME INITIAL_OWNER_EMAIL INITIAL_OWNER_PASSWORD
export PROVISION_FIRST_OWNER_CONFIRMATION=CREATE_INITIAL_OWNER

npm run owner:provision

unset INITIAL_OWNER_PASSWORD INITIAL_OWNER_NAME INITIAL_OWNER_EMAIL
unset PROVISION_FIRST_OWNER_CONFIRMATION
```

`NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` e
`REFRESH_TOKEN_SECRET` devem existir previamente no ambiente seguro. Não
copiar seus valores para documentação, tickets ou logs.

## Verificação sanitizada de prontidão

O verificador é somente leitura e retorna apenas contagens:

```bash
export PRODUCTION_VERIFY_CONFIRMATION=RUN_READ_ONLY_PRODUCTION_CHECK
export VERIFY_EXPECT_EMPTY_BUSINESS_DATA=true
export VERIFY_EXPECT_OWNER=true

npm run production:verify

unset PRODUCTION_VERIFY_CONFIRMATION
unset VERIFY_EXPECT_EMPTY_BUSINESS_DATA VERIFY_EXPECT_OWNER
```

O gate compara os nomes e checksums das migrations aplicadas com o manifesto
oficial, recusa migration ausente, inesperada, alterada, falhada ou revertida,
e lê todas as contagens em um snapshot consistente. Também exige exatamente um
`User`, um `AuthProfile`, uma conta `DONO`, zero refresh tokens ativos em todo o
banco e nenhuma entidade de negócio no banco pré-lançamento.

## Proteção do repositório

- Bancos, SQLite sidecars, dumps, backups, exports `*.dir.tar.*`, SQL fora das
  migrations oficiais, `.env.*` e relatórios locais de credenciais são
  ignorados.
- Novo SQL só é permitido em `backend/prisma/migrations/<id>/migration.sql`.
  As migrations SQLite da raiz permanecem congeladas apenas por preservação
  histórica; qualquer alteração nelas é bloqueada na faixa de commits da PR.
- A CI detecta extensões proibidas, cabeçalhos SQLite/PGDMP disfarçados,
  credenciais PostgreSQL remotas, chaves privadas e tokens de provedores.
- Casos negativos são executados em memória; valores sintéticos não são
  gravados como fixtures.
- O workflow roda em todas as pull requests, inclusive PRs encadeadas.

O script legado de inserção de dados de teste foi removido somente da árvore
atual. Ele continua no histórico, que não foi reescrito.

Como controle administrativo posterior, configurar ruleset da `main` exigindo
PR e os jobs `Repository policy`, `Frontend` e `Backend and PostgreSQL`, além de
ativar secret scanning e push protection no GitHub.

## Sequência de merge proposta

1. Tornar a PR P0 pronta para revisão e executar todos os checks.
2. Squash merge da PR P0 em `main`.
3. Alterar a base da PR P1 para `main`, sincronizar e confirmar diff somente P1.
4. Reexecutar frontend, backend, PostgreSQL 16, migrations e Playwright.
5. Squash merge da PR P1 em `main`.
6. Alterar a base desta PR de prontidão para `main` e sincronizar com a nova
   `main` sem reintroduzir commits P0/P1.
7. Confirmar que o diff contém somente IaC, documentação, comandos
   operacionais e políticas de CI.
8. Reexecutar todos os gates desta PR.
9. Somente após aprovação de custo, Auto Sync desligado e plano de backup
   aprovado, considerar o squash merge da PR de prontidão.

Nenhum merge autoriza deploy automaticamente.

## Rollback operacional futuro

- Manter auto-deploy e Auto Sync desligados.
- Registrar commit e imagem do último backend aprovado.
- Confirmar backup antes de qualquer migration.
- Se o deploy falhar antes da migration, voltar o backend para o artefato
  anterior.
- Se a migration já tiver sido aplicada, só voltar o código se houver
  compatibilidade retroativa confirmada.
- Para rollback de dados, restaurar primeiro em clone isolado, validar
  integridade e obter aprovação explícita antes de trocar conexões.
- Nunca usar `migrate reset`, apagar banco ou executar SQL corretivo improvisado.

Staging e produção permanecem separados durante todo o procedimento.
