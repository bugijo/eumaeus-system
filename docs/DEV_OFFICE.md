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

## Reconciliação do escritório — 2026-10-14 (continuidade)

### Base coordenadora confirmada

- Worktree: `/media/giovanni/HD/Projetos/Eumaeus-dev`.
- Branch: `codex/eumaeus-dev-office-20261012`.
- HEAD de retomada informado: `bac14bf46c0426f32ab773be7674596064f4606d`; após esta continuidade, as alterações ainda estão no working tree até o commit de evidência abaixo.
- `b738fe9bc80d175dcb2af34039751ba8a5f9e232` e `f615bd00cfa6123b2eb76e2aa6611d225cb78af8` permanecem ancestrais locais; nenhum avanço foi retrocedido.
- A branch estava 50 commits à frente de `origin/main`; `origin/main` não foi usado como base de trabalho.

Worktrees inventariadas e preservadas: `/media/giovanni/HD/Projetos/Eumaeus` em `51e6fb3`, `/media/giovanni/HD/Projetos/Eumaeus-autonomous` em `5983a6e`, e os worktrees detached em `870d873`, `4ddfb5c`, `a79802a` e `51e6fb3`. Nenhum apresentou alteração não commitada no inventário. As tarefas dos cinco auditores estavam ociosas; somente o coordenador deste documento permaneceu ativo. Nenhuma worktree foi removida.

### Classificação das entregas recebidas

- `870d873` — frontend: melhoria aproveitável já incorporada por equivalentes posteriores da base coordenadora (estados vazios, ARIA e conclusão de atendimento); transplantar o commit inteiro duplicaria versões antigas.
- `4ddfb5c` — fila operacional: incompatível/duplicada. É uma fila somente leitura baseada em uma superfície `operations` que não é a operação persistida atual; a base coordenadora já possui `/operacao`, contratos, consumo e estorno auditáveis. Não foi feito cherry-pick.
- `a79802a` — receitas: resolvido/duplicado por `9b8d85f` e commits posteriores: impressão protegida, rascunho sem fatos clínicos inventados e remoção de exclusão destrutiva já existem na linha atual. Não foi feito cherry-pick.
- Auditoria contábil em `51e6fb3`: a conclusão de ausência de infraestrutura era correta para aquele ponto, mas não para a linha atual. A implementação posterior de `dacbf16` deixou achados temporais reais: data da fatura usada para recebimentos, estornos misturados, pendência pelo status atual, limite UTC fixo e CSV sem neutralização. O CSV já foi corrigido em `40294ff`; o cálculo temporal foi reproduzido e corrigido nesta continuidade.
- Auditoria backend que relatou módulos ausentes: sem evidência suficiente para a base atual. Comunicação, pacotes, care, financeiro e contexto de tenant existem na linha coordenadora; os riscos apontados foram parcialmente tratados por commits posteriores e permanecem sujeitos a testes de isolamento/concorrência, não a reaplicação de código da base antiga.

### Correção reaplicada na base atual

`FinancialService.prepareAccountingExport` agora interpreta datas de entrada no fuso operacional `America/Sao_Paulo`, consulta faturas até o fim do período, atribui recebimentos a `Payment.receivedAt`, estornos a `Payment.reversedAt` e calcula o saldo na posição histórica do corte. Faturamento e descontos continuam restritos às faturas criadas no período, preservando clínica, centro de resultado e auditoria transacional. O teste sintético cobre fatura anterior, recebimento no período, recebimento posterior e estorno posterior.

Validação anterior: build backend e `prisma validate` passaram.

### Evidência contábil da continuidade

- Comando/diretório/configuração: `npm test -- --maxWorkers=1 --runTestsByPath src/__tests__/financial.service.test.ts --cacheDirectory=/tmp/eumaeus-jest-cache --json --outputFile=/tmp/eumaeus-financial-jest-final.json --detectOpenHandles --verbose`, executado em `/media/giovanni/HD/Projetos/Eumaeus-dev/backend`, usando `backend/jest.config.js` e `src/__tests__/setup.ts`.
- A primeira execução identificou uma expectativa antiga (`pending=20`), não uma falha de cálculo: recebimento parcial de 5,00 sobre total 20,00 implica saldo histórico 15,00. A expectativa foi corrigida com comentário explicativo; a execução final passou 11/11 em 12,085 s, com relatório persistido e sem handles abertos.
- PostgreSQL local: container `eumaeus-postgres-local`, imagem PostgreSQL 16, URL `127.0.0.1:55432/eumaeus_local`; 29 migrations encontradas e aplicadas, incluindo `20261014120000_add_invoice_cancellation_history`. A fixture sintética foi limpa por IDs próprios após execução.
- Prova local: fatura anterior com recebimento no período, fatura do período com recebimento posterior, parcial, estorno posterior, borda do dia operacional e filtro por centro. A execução por centro retornou somente os IDs do centro selecionado (`billed=100.00`, `received=45.00`, `reversed=40.00`, `pending=195.00`); a execução anterior sem centro confirmou o conjunto completo (`billed=230.00`, `received=65.00`, `reversed=40.00`, `pending=305.00`).
- Defeito confirmado e corrigido: o saldo `pending` podia ignorar `resultCenterIds`; agora o subconjunto é reforçado também em memória e há regressão unitária dedicada.
- Descontos: `InvoiceDiscount.createdAt` permite recompor, para operações futuras, descontos lançados depois do corte; registros legados sem histórico adicional não permitem reconstruir mutações manuais do total. Cancelamentos futuros gravam `Invoice.cancelledAt`; cancelamentos legados com `NULL` permanecem limitados ao tratamento conservador como cancelados em qualquer corte.
- Centro de resultado: não há histórico temporal legado de alterações de `Invoice.resultCenterId`/`InvoiceItem.resultCenterId`; portanto uma alteração posterior do centro pode alterar relatórios anteriores. Essa é uma limitação documentada, não foi mascarada com valor inventado.
- API, prévia, PDF e compartilhamento contábil chamam o mesmo `prepareAccountingExport`; a reconciliação completa do CSV visual e das jornadas de interface continua pendente de validação visual local.
- Backend completo: 32 suítes / 166 testes, 156 passaram e 10 ficaram em `medicalRecord.routes.integration.test.ts` e `tutors.test.ts` por fixtures Jest sem identidade/retornos de tutor coerentes; não foram tratados como defeito funcional nem mascarados. A suíte financeira focal passou 11/11.
- Frontend: lint sem erros (17 warnings existentes), build Vite passou em 6m14s e Vitest completo passou 13 arquivos / 87 testes. Os dois testes de Financeiro e os dois de impressão de receita também passaram isoladamente após alinhar mocks e seletor de conteúdo persistido.
