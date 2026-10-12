# Provas PostgreSQL local: isolamento e idempotência

`pg-isolation-idempotency.mjs` é uma prova de integração contra o PostgreSQL
local sintético. Ela não importa serviços de produção, não executa migrations e
não toca no frontend.

O runner só aceita o container `eumaeus-postgres-local` (ou o nome informado
em `EUMAEUS_LOCAL_PG_CONTAINER`) quando a imagem é PostgreSQL e o container está
ativo. Os fixtures usam dois `clinicId` sintéticos (`9101` e `9102`) e um
marcador único por execução. A limpeza ocorre no `finally` e só remove linhas
contendo o marcador daquela execução.

Execução:

```sh
node backend/scripts/real-local/pg-isolation-idempotency.mjs
```

As provas cobrem:

- mesma chave de pagamento, estoque e outbox em clínicas diferentes;
- ausência de leitura cruzada quando o filtro de clínica é aplicado;
- rollback PostgreSQL real quando a auditoria do pagamento viola uma FK;
- contagem final zero dos fixtures após a limpeza.

O resultado é uma evidência de banco local, não uma validação HTTP ou visual.

## Concorrência PostgreSQL real

`pg-concurrency.mjs` abre duas sessões `psql` independentes para cada cenário,
com fixtures sintéticas no `clinicId` `9201`. O marcador de execução é único e
a limpeza ocorre somente depois da coleta do relatório, limitada às linhas
criadas pelo runner.

```sh
node backend/scripts/real-local/pg-concurrency.mjs
```

O runner cobre:

- dois recebimentos simultâneos sobre o mesmo saldo;
- mesma chave de idempotência concorrente;
- duas parcelas legítimas de mesmo valor com chaves distintas;
- consumo concorrente da última sessão de pacote;
- duas saídas sobre estoque insuficiente;
- dois estornos concorrentes.

As transações de recebimento e estorno usam `SERIALIZABLE` e atualização
condicional por `status = 'POSTED'`, espelhando os invariantes aplicados no
serviço financeiro. O processo termina com código `2` quando uma expectativa
de integridade falha. Todas as fixtures são removidas ao final (`Tutor`,
`Payment`, `Product` e `PackageContract` no clinic `9201` iguais a zero).
