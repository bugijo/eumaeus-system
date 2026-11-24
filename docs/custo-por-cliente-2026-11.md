# Custo por cliente e sustentabilidade (23/11/2026)

Medido = lido no servidor, no teste de carga ou numa página com data. Estimado = suposição marcada, a trocar pelo número real.

## 1. Medições

### VPS de produção (Hostinger KVM 1, lido em 23/11/2026)

| Recurso | Valor |
|---|---|
| CPU / RAM / disco | 1 vCPU, 3,9 GB, 48 GB (7 GB usados) |
| Load médio | 0,05 |
| Memória dos containers | api 66 MB, banco 46 MB, web 11 MB |
| Banco | 11 MB, 1 usuário, 0 tutores |

### Teste de carga (pilha local limitada a 1 CPU e 4 GB, um único estabelecimento)

Mistura por ciclo: 16 leituras de tela, 3 vendas, 1 atendimento com baixa de estoque. Corrida de 30 s depois da correção de concorrência.

| Usuários simultâneos sem pausa | req/s | Leitura p50 / p95 | Escrita p50 / p95 | Falhas |
|---|---|---|---|---|
| 5 | 103,7 | 23 / 94 ms | 89 / 180 ms | 0 |
| 20 | 99,4 | 55 / 119 ms | 954 / 1.129 ms | 0 |

- Com 20 usuários **do mesmo estabelecimento** vendendo sem parar, a escrita fica em ~1 s porque as vendas desse estabelecimento entram em fila (é o que impede número repetido e venda acima do saldo). Estabelecimentos diferentes não esperam uns pelos outros.
- A máquina local não é o VPS. O vCPU da Hostinger pode ser mais lento. Refazer no VPS antes de usar estes números como limite.
- Crescimento do banco: 15.367.191 − 14.720.023 = 647 KB para 912 vendas + 304 atendimentos ≈ **0,5 KB por operação**. A medida anterior deu ~1,2 KB. Faixa usada abaixo: 0,5 a 1,2 KB (inclui índices; o Postgres aloca em páginas, por isso a variação).

### Bug encontrado na medição (corrigido)

Vendas simultâneas no mesmo estabelecimento: 10 ao mesmo tempo → 1 aprovada, 9 recusadas com mensagem interna do Prisma. Depois da correção: 30/30 aprovadas; 20 vendas de um produto com saldo 5 → 5 aprovadas, 15 recusadas por estoque, saldo final 0.

## 2. Preços de terceiros (lidos em 23/11/2026, não confirmados na conta)

| Item | Valor | Fonte |
|---|---|---|
| Hostinger KVM 1 / 2 / 4 (renovação) | R$ 59,99 / 77,99 / 129,99 por mês | blogs; **confirmar na fatura real** |
| Backup externo Backblaze B2 | US$ 6,95 por TB/mês, 10 GB grátis | backblaze.com/cloud-storage/pricing |
| Asaas (cobrança da assinatura) | ~R$ 1,99 por Pix/boleto pago; cartão ~2,99% + R$ 0,49 | comparativo de terceiros, out/2026; tabela do contrato prevalece |
| Focus NFe | Growth: R$ 37,90 por CNPJ adicional, 100 notas por CNPJ | focusnfe.com.br/preco (fontes divergem) |

## 3. Custo por cliente (estimativa)

| Custo | Tipo | Valor usado | Observação |
|---|---|---|---|
| VPS | fixo | R$ 60/mês | dividido por todos os clientes |
| Domínio | fixo | ~R$ 3,50/mês | não verificado hoje |
| Backup externo | fixo | R$ 0 a 5/mês | cabe nos 10 GB grátis por bastante tempo |
| Cobrança (gateway) | por cliente | R$ 2,50 | média entre Pix e cartão |
| Imposto | por cliente | 6% da mensalidade | **estimativa**: Simples Anexo III; pelo Fator R pode cair no Anexo V (15,5%). Confirmar com contador |
| Suporte | por cliente | 1 h/mês × R$ 50/h | **o maior custo**; troque pelo valor da sua hora |
| Implantação | única | 3 h | cobrar taxa de implantação ou diluir em 12 meses |

Contribuição por cliente com mensalidade média de R$ 120: 120 − 2,50 − 7,20 − 50 = **R$ 60,30/mês**. Sem contar sua hora de suporte: R$ 110,30.

## 4. Cenários (estimativa, mensalidade média R$ 120)

| Clientes | Receita | Infra | Custo variável | Sobra/mês | Infra sugerida |
|---|---|---|---|---|---|
| 10 | 1.200 | 70 | 597 | **533** | KVM 1 |
| 30 | 3.600 | 70 | 1.791 | **1.739** | KVM 1 |
| 50 | 6.000 | 90 | 2.985 | **2.925** | KVM 2 + backup externo |
| 100 | 12.000 | 145 | 5.970 | **5.885** | KVM 4 ou 2× KVM 2 |

- **Ponto de equilíbrio da infraestrutura: 1 cliente** (a contribuição de R$ 60 já cobre o VPS). Com 2 clientes sobra para o upgrade para KVM 2 (+R$ 18/mês).
- **O gargalo não é o servidor, é o suporte.** Com 50 clientes a 1 h/mês são 50 h de suporte por mês. Antes de faltar CPU, falta tempo.

### Capacidade de um KVM 1 (estimativa)

- Perfil suposto: 3 usuários ativos por estabelecimento no horário de pico, 0,2 req/s cada → 0,6 req/s por estabelecimento.
- Teto seguro: 30% dos ~100 req/s medidos = 30 req/s → **~50 estabelecimentos em pico simultâneo**. Como nem todos atingem o pico juntos, a carga real tende a ser menor.
- Disco: 100 operações/dia × 312 dias × 0,5 a 1,2 KB = **15 a 37 MB por estabelecimento por ano**. 50 clientes = 0,8 a 1,9 GB/ano.
- **Risco de disco real: o backup.** Hoje ficam 30 dumps diários no mesmo disco. Com banco de 2 GB, isso é até 60 GB (menos com a compressão do formato custom), acima dos 48 GB do KVM 1. Também se perde tudo se o VPS for perdido. Prioridade: cópia externa (B2) e menos dumps locais (ex.: 7).

### Quando fazer upgrade

| Sinal (monitorar) | Ação |
|---|---|
| CPU p95 > 60% por uma semana, ou ~40 clientes | KVM 2 |
| Disco > 70% | reduzir dumps locais, enviar para B2, depois KVM maior |
| Escrita p95 > 500 ms em horário normal | investigar consulta lenta antes de comprar máquina |

## 5. Limitar usuários?

**Contraponto à premissa.** Usuário a mais quase não pesa no banco. O banco cresce com o volume de **operações** (atendimentos, vendas, prontuários). Uma clínica com 10 logins e 40 atendimentos por dia pesa o mesmo que uma com 3 logins e o mesmo volume. Usuário a mais pesa só um pouco na CPU, porque mais gente abre telas ao mesmo tempo.

O limite de usuários serve, então, como **alavanca de preço**, não de proteção técnica. É assim que o mercado cobra (seção 2 da pesquisa de preços).

| Plano | Proposta | Usuário extra |
|---|---|---|
| Pet Shop | 3 usuários | R$ 15/mês (Fourpet cobra R$ 14,90) |
| Clínica | 5 usuários | R$ 15/mês |
| Clínica + Pet Shop | 8 usuários | R$ 15/mês |

Trade-off: "usuários ilimitados" era o argumento de venda mais simples contra quem cobra por usuário. Limitar aumenta a receita por cliente grande e abre caminho de upgrade, mas perde esse argumento. Meio-termo: limites generosos (acima da Fourpet) e o extra barato.

Por que pode falhar: o cliente divide um login entre várias pessoas para não pagar o extra. Isso estraga o registro de quem fez o quê, que é um ponto forte do sistema (acessos por funcionário, autoria nas vendas).

## 6. O que você precisa me dar para trocar estimativa por número real

1. Valor real da fatura Hostinger (renovação e prazo contratado).
2. Valor da sua hora e quanto suporte espera por cliente.
3. Regime tributário (verificar com contador se a atividade cabe no MEI ou no Simples, e em qual anexo).
4. Gateway de cobrança escolhido.
