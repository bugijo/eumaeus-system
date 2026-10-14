# Reconciliação do Escritório Dev — Plano de Implementação

> **Para agentes:** executar tarefa por tarefa com `superpowers:executing-plans` e TDD; as etapas usam checkbox para acompanhamento.

**Objetivo:** corrigir na base coordenadora o cálculo histórico de exportação contábil sem portar versões antigas inteiras.

**Arquitetura:** manter a implementação atual e separar semanticamente faturamento, recebimentos, estornos e saldo de contas. O período de entrada será interpretado no fuso operacional `America/Sao_Paulo`, usando os campos já existentes `Payment.receivedAt` e `Payment.reversedAt`; nenhuma migration é necessária.

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
- [ ] Executar o teste focal: Jest instalado ficou sem saída antes da descoberta e foi interrompido por timeout; a verificação sintética do serviço compilado passou.

### Tarefa 2: cálculo histórico compatível

**Arquivos:**
- Modificar: `backend/src/services/financial.service.ts`
- Testar: `backend/src/__tests__/financial.service.test.ts`

- [x] Interpretar `from`/`to` como limites do dia em `America/Sao_Paulo`.
- [x] Carregar faturas da clínica criadas até o fim do período, mantendo o filtro de centro de resultado.
- [x] Calcular faturamento/descontos somente das faturas criadas no período; recebimentos e estornos pela data do respectivo evento; saldo pela posição no fim do período.
- [x] Preservar auditoria transacional e contrato do relatório.
- [ ] Executar teste focal e suíte backend: bloqueados pelo travamento do Jest; build e `prisma validate` passaram.

### Tarefa 3: registro da reconciliação

**Arquivos:**
- Modificar: `docs/DEV_OFFICE.md`

- [x] Registrar HEAD real, classificação das cinco entregas, worktrees/tarefas ativas e a correção aplicada, sem apagar histórico.
- [x] Revisar diff e confirmar que não há arquivos gerados ou alterações fora do escopo.

