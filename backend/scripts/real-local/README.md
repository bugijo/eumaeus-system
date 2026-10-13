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

## Harness HTTP autenticado

`http-concurrency-authenticated.mjs` é uma prova pela aplicação real, sem
mocks: cria duas clínicas sintéticas e contas temporárias, faz login por
`/api/auth/login` e dispara requisições simultâneas para pagamentos,
idempotência, estorno, consumo da última sessão, estoque e tentativas
cruzadas. Remove apenas linhas identificadas pelo marcador da própria execução;
a senha é mantida somente em memória e nunca é impressa.

Pré-requisitos: `eumaeus-postgres-local` com `eumaeus_local`, schema migrado e
backend local iniciado com `DATABASE_URL`, `JWT_SECRET` e
`REFRESH_TOKEN_SECRET` válidos. Nunca aponte para banco remoto.

```bash
npm --prefix backend run build
DATABASE_URL='postgresql://eumaeus:eumaeus_local_only@127.0.0.1:55432/eumaeus_local' \
JWT_SECRET='(segredo local com pelo menos 32 caracteres)' \
REFRESH_TOKEN_SECRET='(outro segredo local com pelo menos 32 caracteres)' \
NODE_ENV=test PORT=3334 node backend/dist/src/bootstrap.js
node backend/scripts/real-local/http-concurrency-authenticated.mjs
```

Execução local posterior: pagamentos concorrentes mantiveram uma linha e total
`5.00`; a mesma chave manteve uma linha; duas parcelas legítimas de `1.25` com
chaves distintas ficaram em duas linhas (um conflito serializável foi repetido
com a mesma chave); pacote, estoque e estorno concorrentes preservaram seus
invariantes; escrita e leitura cruzadas foram rejeitadas. O harness terminou com
`ok: true` contra o PostgreSQL Docker local, sem dados reais ou remoto. A falha
anterior de allowlist foi corrigida no proxy sem liberar SQL arbitrário.
