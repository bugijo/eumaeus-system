# Escritório Dev Local — Eumaeus

## Base e limites

- Worktree de continuidade: `/media/giovanni/HD/Projetos/Eumaeus-dev`.
- Branch: `codex/eumaeus-dev-office-20261012`, baseada em `origin/main` publicado em `661d574bf8460573c4f8c6ce543938b57b3d05b3`.
- A worktree original `/media/giovanni/HD/Projetos/Eumaeus-autonomous` permanece preservada.
- Somente PostgreSQL Docker local e dados sintéticos. É proibido acessar produção/banco remoto, enviar mensagens reais, emitir documentos fiscais, contratar serviços ou alterar o Hermes.
- Navegador, migrations, integração entre frentes e commits são responsabilidade do coordenador.
- A skill `eumaeus-dev` não foi encontrada nas skills locais; esta missão segue `AGENTS.md`, `docs/AUTONOMOUS_MISSION.md`, `docs/IMPLEMENTATION_PLAN.md` e estas regras persistidas.

## Organização das frentes

Subagentes independentes foram iniciados como auditorias somente leitura, sem edição concorrente na worktree coordenadora:

1. Produto/processos: jornadas clínicas e petshop, critérios de aceite.
2. Comercial/experiência: catálogo, cobrança, preferências e UX administrativa.
3. Backend/dados: tenant, Prisma, transações, Decimal e migrations.
4. Frontend/acessibilidade: telas, estados, permissões e persistência visual.
5. Cibersegurança: autenticação, RBAC, idempotência, isolamento e segredos.
6. Testes/confiabilidade: cobertura focal, concorrência, rollback e diagnóstico.

Os relatórios serão revisados pelo coordenador antes de qualquer implementação. Nenhum agente está autorizado a usar navegador, banco remoto, produção, Hermes ou integrações externas.

## Ciclo de execução

Planejar → auditar → implementar em escopo disjunto → testar focalmente → revisar diff/segurança → validar uso local → registrar evidência → commit pequeno → próxima pendência.

Hipóteses só serão classificadas como vulnerabilidades após reprodução local ou teste pertinente. Testes por HTTP/API, testes automatizados e validação visual serão registrados separadamente.

## Critérios de aceite da continuidade

- Toda operação financeira autoritativa usa Decimal, autoria autenticada, isolamento por clínica, idempotência e auditoria transacional.
- Toda relação operacional impede associação entre clínicas e dados ambíguos permanecem bloqueados em `TenantDataReview`.
- Comunicação permanece em simulação, com deduplicação, cancelamento, revalidação de preferências, retry limitado e histórico.
- Telas têm estados de carregamento, erro, ausência e permissão; existência de endpoint não conta como fluxo visual.
- Migrations são executadas somente no PostgreSQL local isolado e não há deploy implícito.
