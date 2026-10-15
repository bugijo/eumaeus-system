# Reconciliação do Escritório Dev — Plano de Implementação

> **Para agentes:** executar tarefa por tarefa com `superpowers:executing-plans` e TDD; as etapas usam checkbox para acompanhamento.

**Objetivo:** corrigir na base coordenadora o cálculo histórico de exportação contábil sem portar versões antigas inteiras.

**Arquitetura:** manter a implementação atual e separar semanticamente faturamento, recebimentos, estornos e saldo de contas. O período de entrada será interpretado no fuso operacional `America/Sao_Paulo`, usando os campos `Payment.receivedAt` e `Payment.reversedAt`. A migration local de `Invoice.cancelledAt` registra cancelamentos futuros sem inventar datas para legados.

**Stack:** TypeScript, Prisma, Jest, PostgreSQL local sintético.

**Spec:** solicitação do usuário nesta conversa; referências operacionais em `docs/DEV_OFFICE.md`.

## Restrições globais

- Preservar todas as worktrees e commits paralelos; não fazer merge/cherry-pick cego.
- Trabalhar somente em `/media/giovanni/HD/Projetos/Eumaeus-dev`, branch `codex/eumaeus-dev-office-20261012`.
- Sem produção, banco remoto, Hermes, deploy, gastos, mensagens reais ou emissão fiscal.
- Não tratar dependência ausente ou teste interrompido como defeito funcional.

## Foco de revisão

- Pagamento fora da data da fatura não pode aparecer no período errado; teste com datas distintas.
- Estorno deve ser reconhecido pela data do estorno, não pela data da fatura; teste com `reversedAt` posterior.
- Saldo pendente deve ser o saldo no fim do período, não o total/status atual; teste com recebimento posterior ao corte.
- Limites de data devem representar o dia local de São Paulo; teste de fronteira UTC.
- O isolamento por clínica e centro de resultado deve permanecer no filtro da consulta; teste das cláusulas Prisma.

### Tarefa 1: teste de regressão contábil temporal

**Arquivos:**
- Modificar: `backend/src/__tests__/financial.service.test.ts`

- [x] Adicionar teste com fatura criada antes do período, recebimento dentro do período e estorno em outra data, verificando `received`, `reversed` e `pending` históricos.
- [x] Executar o teste focal: Jest com `--maxWorkers=1`, cache em `/tmp/eumaeus-jest-cache`, relatório em `/tmp/eumaeus-financial-jest-final.json`, 11/11 testes passou.

### Tarefa 2: cálculo histórico compatível

**Arquivos:**
- Modificar: `backend/src/services/financial.service.ts`
- Testar: `backend/src/__tests__/financial.service.test.ts`

- [x] Interpretar `from`/`to` como limites do dia em `America/Sao_Paulo`.
- [x] Carregar faturas da clínica criadas até o fim do período, mantendo o filtro de centro de resultado.
- [x] Calcular faturamento/descontos somente das faturas criadas no período; recebimentos e estornos pela data do respectivo evento; saldo pela posição no fim do período.
- [x] Preservar auditoria transacional e contrato do relatório.
- [x] Executar teste focal após a correção: 11/11 passou; `prisma validate`, `prisma generate` e `prisma migrate deploy` passaram no PostgreSQL local.
- [x] Reproduzir no PostgreSQL local datas de recebimento/estorno distintas, recebimento posterior, filtro de centro e bordas do período; o filtro de centro corrigiu um defeito confirmado no saldo pendente.
- [ ] Preservar histórico de centro de resultado: o schema legado não tem tabela/evento temporal; relatórios atuais refletem o centro mutável na data da consulta. Não foi inventado histórico retroativo.
- [ ] Reconstituir cancelamentos legados: `cancelledAt` nulo em registros antigos não informa a data; esses registros continuam tratados como cancelados em qualquer corte. Operações futuras passam a gravar a data.

### Tarefa 3: registro da reconciliação

**Arquivos:**
- Modificar: `docs/DEV_OFFICE.md`

- [x] Registrar HEAD real, classificação das cinco entregas, worktrees/tarefas ativas e a correção aplicada, sem apagar histórico.
- [x] Revisar diff e confirmar que não há arquivos gerados ou alterações fora do escopo.

