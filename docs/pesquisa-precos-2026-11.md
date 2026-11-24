# Pesquisa de preços: sistemas para clínica veterinária e pet shop

Coleta feita em 23/11/2026, lendo a página oficial de preços de cada sistema.
Os valores abaixo são **preço cheio mensal**. Várias empresas estavam com promoção de Black Friday (50% nos 3 primeiros meses); a promoção foi ignorada.
Preços "sob consulta" ou vistos só em agregadores (B2B Stack, Capterra, GetApp) não entraram.

## 1. Preços medidos

### Pet shop / banho e tosa

| Sistema | Plano | R$/mês | Usuários | Nota fiscal | Fonte |
|---|---|---|---|---|---|
| Fourpet | Groomer | 59 | 1 | não | fourpet.com.br |
| Fourpet | Pet Shop | 89 | 5 | não | fourpet.com.br |
| Fourpet | Pet Shop + PDV Fiscal | 239 | 5 | NFC-e (+R$ 299 de implantação) | fourpet.com.br |
| Loopvet | Start (tudo incluso) | 97,90 | 1 | +R$ 97,90 | loopvet.com.br |
| SuriVet | Petshop | a partir de 150 | 3 | módulo à parte | surivet.com.br |
| SimplesVet | Pet shop Básico | 157 | 3 | até 80 notas/mês | simples.vet/precos |
| Loopvet | Plus (tudo incluso) | 177,90 | 3 | +R$ 97,90 | loopvet.com.br |
| SimplesVet | Pet shop Avançado | 220 | 5 | ilimitada | simples.vet/precos |
| Vetus | 1º plano (Essencial) | a partir de 229,89 | 2 | +R$ 149,90 | vetus.com.br |
| Vetus | 2º plano (Avançado) | a partir de 252,89 | 2 | +R$ 149,90 | vetus.com.br |
| Pet Shop Control | Único | 279 | 1 | incluso (+R$ 1.000 de implantação) | petshopcontrol.com.br/precos |

### Clínica veterinária (a maioria já inclui pet shop)

| Sistema | Plano | R$/mês | Usuários | Internação | Nota fiscal | Fonte |
|---|---|---|---|---|---|---|
| VetSmart | PRO (só prontuário) | 69,90 | — | +R$ 99,90 | NFS-e | plano.vetsmart.com.br |
| Loopvet | Start | 97,90 | 1 | incluso | +R$ 97,90 | loopvet.com.br |
| VetSoft | Inicial | 140 | 1 | +R$ 97 | +R$ 97 cada (NFC-e, NFS-e) | vetsoft.com.br/planos |
| Fourpet | Clínicas | 159 | 5 | incluso | não | fourpet.com.br |
| Loopvet | Plus | 177,90 | 3 | incluso | +R$ 97,90 | loopvet.com.br |
| VetSoft | Dupla | 217 | 2 | +R$ 97 | +R$ 97 cada | vetsoft.com.br/planos |
| Loopvet | Pro | 237,90 | 6 | incluso | +R$ 97,90 | loopvet.com.br |
| SuriVet | Clínica | a partir de 250 | 3 | no plano de R$ 450 | módulo à parte | surivet.com.br |
| VetSoft | Trio | 261 | 3 | +R$ 97 | +R$ 97 cada | vetsoft.com.br/planos |
| Vetus | 3º plano (com internação e vacinas) | a partir de 287,39 | 2 | incluso | +R$ 149,90 | vetus.com.br |
| VetSoft | Equipe | 315 | 5 | +R$ 97 | +R$ 97 cada | vetsoft.com.br/planos |
| Loopvet | Ultra | 357,90 | ilimitado | incluso | +R$ 97,90 | loopvet.com.br |
| SimplesVet | Clínica e Hospital | 359 | 3 | +R$ 136 | +R$ 153 | simples.vet/precos |
| VetSoft | Clínica | 401 | 10 | +R$ 97 | +R$ 97 cada | vetsoft.com.br/planos |
| SimplesVet | Clínica e Hospital | 419 / 479 / 589 / 879 / 1.099 | 5 / 10 / 15 / 25 / ilimitado | +R$ 136 | +R$ 153 | simples.vet/precos |
| VetSoft | Ilimitado | 860 | ilimitado | +R$ 97 | +R$ 97 cada | vetsoft.com.br/planos |

Outros dados lidos nas mesmas páginas:
- VetSoft tem plano grátis (1 usuário, até 30 animais).
- Fourpet: cada filial custa 50% do plano; usuário extra R$ 14,90/mês.
- Vetus: multi-filial R$ 129,90/mês.
- SimplesVet: WhatsApp automático a R$ 0,50 por mensagem.
- Actana (ERP genérico com página para pet shop): R$ 99,90 cheio, R$ 49,90 em oferta. Fica fora da comparação por não ser específico.

## 2. Leitura (interpretação, não medição)

- **Como o mercado cobra:** quase todos cobram por número de usuários. Nota fiscal e internação são módulos pagos à parte, de R$ 97 a R$ 153 cada.
- **Faixa típica com 3 usuários (contas feitas com as tabelas acima):**
  - Pet shop: R$ 150 a 180 (SuriVet, SimplesVet Básico, Loopvet Plus). A Fourpet é a mais barata: R$ 89 com 5 usuários.
  - Clínica: R$ 178 a 359 (Loopvet Plus, SuriVet, VetSoft Trio, Vetus, SimplesVet). A Fourpet cobra R$ 159 com 5 usuários e pet shop incluso.
- **Clínica + pet shop:** nenhum concorrente lido cobra a mais por juntar os dois. Clínica já inclui pet shop em Fourpet, Loopvet, VetSoft e SimplesVet. Só o SuriVet cobra por CNPJ.

## 3. Onde o Eumaeus está hoje (lido no código e em tarefas.md)

| Ponto | Eumaeus | Mercado |
|---|---|---|
| Nota fiscal (NFC-e/NFS-e) | não tem | módulo pago ou incluso em quase todos |
| Abertura/fechamento de caixa | não tem | VetSoft, Loopvet e outros têm |
| Importação de XML de compra | não tem | VetSoft, Loopvet, SimplesVet |
| WhatsApp automático | a fila de lembretes existe, mas não encontrei envio para o WhatsApp no código | pago por mensagem ou módulo |
| Internação | tem, no plano Clínica | módulo pago em VetSoft, SimplesVet e VetSmart |
| Limite de usuários | não limita | quase todos limitam |
| Rateio de contas entre clínica e pet shop | tem | não vi em nenhuma página |
| Tempo de mercado e avaliações | nenhum cliente além do primeiro | anos de mercado, depoimentos |

## 4. Recomendação (estimativa)

Sem nota fiscal e sem histórico de clientes, cobrar acima da Fourpet é difícil de justificar. Proposta revisada:

| Plano | Antes (sem pesquisa) | Revisado | Referência mais próxima |
|---|---|---|---|
| Pet Shop | R$ 99 | **R$ 79** | Fourpet Pet Shop R$ 89, sem fiscal |
| Clínica | R$ 149 | **R$ 129** | Fourpet Clínicas R$ 159; Loopvet Start R$ 97,90 com 1 acesso |
| Clínica + Pet Shop | R$ 199 | **R$ 149** | o mercado não cobra a mais por juntar; abaixo da Fourpet Clínicas |

- Usuários ilimitados nos três planos. É o diferencial mais fácil de explicar contra quem cobra por usuário.
- Quando a nota fiscal existir: vender como módulo de R$ 79 a 97, na faixa do mercado (VetSoft R$ 97, Loopvet R$ 97,90).
- Avaliar preço de lançamento fixo por 12 meses para os primeiros clientes, em vez de desconto nos 3 primeiros meses, que é o que os concorrentes fazem.

### Trade-offs e por que pode falhar

- **Preço baixo é difícil de subir depois.** Quem entra a R$ 79 reclama ao ir para R$ 99. Alternativa: anunciar o preço cheio e dar desconto de lançamento com prazo.
- **O custo por cliente não foi medido.** VPS, backup, suporte e tempo de implantação definem o piso. Sem esse número, nenhum preço está provado como sustentável.
- **Preço de tabela não é preço praticado.** Concorrentes negociam desconto, fidelidade anual e implantação. Esta pesquisa só vê a vitrine.
- **Juntar clínica e pet shop sem cobrar a mais** tira o argumento de upgrade. O ganho está em simplificar a escolha: quem tem os dois negócios não sente que paga duas vezes.
- **Promoções ativas (Black Friday)** podem distorcer a percepção do cliente nesta semana: SimplesVet a R$ 78,50 e Loopvet a R$ 48,95 nos 3 primeiros meses.

## 5. Limites desta pesquisa

- Não foram consultados: Doggi Suite, Syncpetz, Gestor Pet Shop, UpGestão, VetControl e Sistemavetsy. Não achei a página oficial de preços deles, só agregadores.
- Não houve conversa com clientes nem com vendedores. Isso seria pesquisa de mercado de verdade e muda mais o preço do que qualquer tabela.
- Tamanho do mercado (número de clínicas e pet shops na região) não foi levantado.
