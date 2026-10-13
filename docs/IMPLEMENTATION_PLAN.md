# Eumaeus — plano de implementação

Atualizado em 2026-10-09. Branch de trabalho: `codex/eumaeus-autonomous-20261007`.

Registro: a skill `eumaeus-dev` não foi encontrada nas skills locais nem nas instruções do repositório; a execução segue `AGENTS.md`, este plano e os requisitos do comando.

## Estado da auditoria inicial

- [x] Confirmada a origem remota `https://github.com/bugijo/eumaeus-system` e sincronizado `origin/main` em `51e6fb3`.
- [x] Preservado o trabalho local anterior no `stash@{0}` da branch `codex/eumaeus-production-launch-fixes`; a pasta original não é o ambiente de implementação.
- [x] Identificado o caminho efetivo do backend: `backend/prisma/schema.prisma`, PostgreSQL e migrações em `backend/prisma/migrations/`.
- [x] Classificado `prisma/schema.prisma` na raiz como schema SQLite legado; ele não deve ser usado para evoluir o backend.
- [x] Identificados preços demonstrativos em `ServiceService` e preço padrão de consulta em `AppointmentService`; devem ser substituídos por catálogo/dados cadastrados antes de uso comercial.
- [x] Identificados campos monetários `Float` em produto, serviço, fatura e itens de fatura.
- [x] Dependências instaladas no worktree e checks de baseline executados.

## Lote 1 — estabilização

### Em andamento

- [x] Validar build/testes do frontend e backend após instalar dependências.
- [ ] Corrigir divergências de schema/migrações somente no caminho efetivo do backend.
- [x] Adicionada migração monetária segura para `Decimal(12,2)`, com conversão explícita; aplicação remota permanece pendente.
- [x] Auditoria inicial de rotas/RBAC concluída; configurações agora usam `clinicId` assinado no token e ignoram `?clinicId=` fornecido pelo cliente.
- [x] Adicionados escopos `clinicId` a Pet, Appointment, prontuário, produtos, serviços, faturas e itens; proxy Prisma aplica o contexto autenticado a leituras, alterações, exclusões e criações.
- [x] Rotas de disponibilidade passaram a exigir autenticação; criação de pet/agendamento valida a relação tutor-pet dentro da clínica.
- [x] Registros legados sem atribuição autoritativa entram em `TenantDataReview`; nenhuma empresa é atribuída silenciosamente. A fila cobre todas as tabelas operacionais escopadas.
- [ ] Prescription e alguns fluxos históricos ainda precisam de revisão específica de vínculo; os registros legados permanecem bloqueados até resolução explícita.
- [x] PostgreSQL local Docker preparado, migrations aplicadas e conversão Float→Decimal testada com arredondamento, limite máximo e overflow.
- [x] Backup físico `pg_dump` e restauração em banco local separado executados; contagens e soma financeira conferidas (`2:1:30.00` antes/depois).

### Critérios de aceite

- `npm run build` e `npm test` do frontend passam, ou falhas ficam reproduzíveis e registradas.
- `npm run build`, `npm test` e `npm run prisma:validate` do backend passam, ou cada bloqueio fica registrado.
- Nenhuma migração é aplicada em produção nesta missão.
- Valores monetários do backend não usam aritmética binária nos fluxos de produto, serviço e fatura.

## Lote 2 — base operacional

- [ ] Modelar empresa, unidade, marca e centro de resultado sem quebrar o piloto de clínica única.
- [ ] Separar clínica, banho e tosa e loja em lançamentos e relatórios.
- [ ] Implementar agenda com profissional, duração, recorrência e conflito transacional.
- [ ] Implementar estados e histórico de atendimento; orçamento versionado e adicionais autorizados.
- [ ] Implementar pacotes com consumo idempotente e sem dupla receita.
- [ ] Implementar caixa, pagamentos parciais, contas, taxas e rateios.
- [ ] Evoluir estoque para custo, fornecedores, lotes, validade, fracionamento, perdas e devoluções.

## Lote 3 — comunicação automática

- [x] Criar preferências persistentes por tutor, remetente e categoria, com pausa e parada total.
- [x] Criar outbox persistente com chave de deduplicação, tentativas/histórico e revalidação da preferência antes da simulação.
- [x] Criar adapter de despacho exclusivamente em simulação; nenhuma chamada externa é feita.
- [x] Integrar eventos de estado, reagendamento e cancelamento em transações; a conclusão de atendimento e a exclusão de atendimento ainda exigem revisão de integração clínica específica.
- [x] Cobrir revogação após enfileiramento, duplicidade, reagendamento, cancelamento, falha de provedor e indisponibilidade de IA no dispatcher simulado.

## Lote 4 — clínica e documentos

- [ ] Evoluir prontuário, peso/unidade, exames, anexos, receitas versionadas e PDF.
- [ ] Preparar assinatura digital distinguindo certificado de imagem.
- [ ] Separar controlados e validar requisitos em fontes oficiais antes de comunicar.
- [ ] Registrar lote de vacina e próxima data definida pela veterinária.

## Lote 5 — fiscal

- [ ] Auditar integração atual e separar NFS-e de NFC-e/NF-e.
- [ ] Persistir processamento, autorização, rejeição, cancelamento, XML e protocolos.
- [ ] Garantir idempotência e homologação; não emitir documentos reais.

## Lote 6 — agentes e expansão

- [ ] Separar permissões de operação e marketing dentro da aplicação, sem microserviços inicialmente.
- [ ] Preparar alertas regionais com fonte, data, local, doença, espécie e validade; revisão veterinária obrigatória.
- [ ] Planejar especialistas, cirurgias, internação, alertas críticos internos e isolamento comercial entre empresas.

## Bloqueios e decisões

- Dependências foram instaladas. `npm audit fix --package-lock-only` foi usado sem `--force`; o backend ficou sem vulnerabilidades de produção. O frontend ainda tem vulnerabilidades de toolchain/dev e pacotes sem correção compatível sem upgrades maiores.
- Não há credenciais nem banco de homologação fornecidos; backup/restauração e migração remota não podem ser declarados como executados.
- A evolução deve usar o schema/migrações do backend. O schema SQLite legado da raiz permanece preservado e documentado.
- O modo simulação é obrigatório para comunicação e fiscal; nenhuma mensagem ou nota real será emitida.
- O catálogo agora é persistido por clínica (`CatalogService`), com preço Decimal, duração, categoria, ativo e snapshot no atendimento; o fallback demonstrativo de fatura foi removido.
- Usuários podem ser desativados por `User.active`; login, refresh e requisições protegidas rejeitam contas inativas.
- `Decimal` é convertido para número no JSON da API via replacer do Express, preservando o contrato atual do frontend sem usar `Float` no banco.

## Evidências

- Estado remoto confirmado com `git fetch --prune origin` e `git ls-remote`.
- Auditoria de schemas, scripts, serviços e migrações executada em 2026-10-07.
- `npm run build` inicial não pôde iniciar porque `vite` ainda não estava instalado; nenhum resultado de teste foi inventado.
- Após `npm ci`: backend `prisma:validate`, build e 98 testes passaram; frontend build e 81 testes passaram.
- Após a migração monetária: backend `prisma:validate`, geração do Prisma Client, build e 98 testes passaram novamente.
- A migração `z_20261007000000_money_decimal` foi criada, mas não foi aplicada a nenhum banco remoto.
- Auditoria posterior ao lockfile: backend `npm audit --omit=dev` passou sem achados; frontend ficou com 5 altos e 5 moderados, concentrados em toolchain/dev ou sem correção não-major.
- PostgreSQL Docker local `eumaeus-postgres-local` aplicou as 3 migrations; `10.005`/`19.995` arredondaram para `10.01`/`20.00`, `9999999999.99` foi aceito e `10000000000.00` foi rejeitado por overflow.
- Após os lockfiles e o contrato Decimal→JSON: frontend build passou e 81 testes passaram; backend build e 98 testes passaram, além de 2 testes específicos de contexto de clínica.
- 2026-10-08: migration local de tenant, revisão de legado, ativação de usuários e comunicação aplicada no PostgreSQL Docker isolado; backend build e 16 suítes/100 testes passaram.
- Evidência manual local: clínica 1 leu 1 tutor sintético e clínica 2 leu 0; outbox duplicado retornou o mesmo registro e despacho produziu `simulated=1`, sem envio externo.
- Tarefas automáticas de lembrete agora enumeram clínicas existentes e executam sob contexto de cada clínica; provisionamento inicial também executa explicitamente no contexto da clínica piloto.
- Verificação final do checkpoint: backend build passou; backend `npm test -- --runInBand` passou com 16 suítes/100 testes; frontend `npm test -- --run` passou com 10 arquivos/81 testes; frontend build passou.

## Próximo checkpoint (histórico, supersedido pelos checkpoints abaixo)

- Integrar outbox também às transições de atendimento, reagendamento e cancelamento dentro da mesma transação, cobrindo revogação posterior ao enfileiramento.
- Adicionar testes HTTP de escrita cruzada para cada entidade e teste de acesso revogado com access token já emitido.
- Resolver explicitamente os registros em `TenantDataReview` antes de qualquer backfill; não promover os dados sintéticos locais.
- Completar a trilha Decimal entrada→cálculo autoritativo→banco→API→frontend para faturas, mantendo números serializados apenas para apresentação.

## Checkpoint 2026-10-08 — segurança, comunicação e pacotes

- [x] Proxy Prisma bloqueia `upsert` sem registro existente no tenant, transações em array, SQL direto de escrita e SQL de leitura fora da lista operacional segura; relações em `where`, `select` e `include` recebem escopo quando aplicável.
- [x] Middleware consulta a conta em cada requisição protegida; access token emitido antes da desativação retorna `401 Acesso revogado`.
- [x] HTTP local validado: clínicas distintas listam apenas seus tutores; leitura cruzada retorna `404`; alteração cruzada não altera o registro.
- [x] Transições `ARRIVED`, `IN_PROGRESS`, `READY`, `COMPLETED`, reagendamento e cancelamento invalidam outbox antigo e enfileiram o evento novo na mesma transação do atendimento.
- [x] Preferências e histórico ganharam endpoints e tela `/operacao`; dispatcher revalida pausa/parada total e usa claim atômico para concorrência.
- [x] Dispatcher local: dois workers concorrentes não duplicaram claim; falha sintética gerou `FAILED` e retry posterior `SIMULATED`; pausa/parada geraram `CANCELLED`.
- [x] Fallback financeiro demonstrativo de R$ 50,00 removido; atendimento sem serviço/produto contratado não é faturado.
- [x] Pacotes persistidos por clínica com preço Decimal, contrato com snapshot, validade, saldo, consumo idempotente e estorno; consumo concorrente não deixou saldo negativo nem duplicou sessão.
- [x] Tela operacional básica criada para preferências, histórico simulado e catálogo de pacotes.
- [ ] Fluxo completo no navegador ainda não foi validado ponta a ponta: falta executar a jornada autenticada de cadastro, agenda, etapas, pacote, cobrança e avisos em UI local.
- [ ] Descontos ainda não possuem campo/regra persistida; o cálculo Decimal cobre preço, quantidade, arredondamento e snapshots, mas desconto é próximo incremento.
- [x] Simulação de navegador local validou login sintético, `/operacao`, catálogo de pacote Decimal, configuração de preferência e histórico de avisos simulados; CORS para `127.0.0.1:4173` foi habilitado somente para desenvolvimento local.
- [ ] A tela operacional ainda não cria contratos, registra sessões, executa consumo/estorno nem fecha cobrança; essas operações estão disponíveis no backend e foram validadas por script local, mas não por uma jornada visual completa.

### Checkpoint 2026-10-08 — contratos de pacotes na operação

- [x] `PackageSession.reversalReason` persistido por migration local; estorno sem justificativa é recusado.
- [x] Tela `/operacao` agora permite selecionar pacote, criar contrato para tutor/pet, consultar contrato/saldo, consumir sessão e estornar com justificativa; histórico de sessões permanece visível.
- [x] Backend `prisma migrate deploy`, build e 16 suítes/100 testes; frontend build e 10 arquivos/81 testes.
- [ ] A jornada completa ainda precisa de validação visual com cadastro/agendamento/cobrança; esta tela usa IDs operacionais e não substitui as telas de cadastro.

### Checkpoint 2026-10-09 — especialistas na operação

- [x] Tela protegida `/especialistas` adicionada para consultar perfis persistidos, cadastrar usuário/especialidade informada e configurar disponibilidade.
- [x] A tela mostra estados de carregamento, erro e ausência de registros; não cria especialidades, habilitações ou preços implícitos.
- [x] Backend rejeita associação duplicada de especialista ao mesmo agendamento antes da constraint, preservando o snapshot de repasse.
- [ ] Associação e confirmação ainda não têm formulário visual dedicado; permanecem disponíveis pela API protegida e precisam ser integradas à tela de agenda.
- [ ] Internação e cirurgia continuam pendentes de implementação; ausência de código não é tratada como bloqueio externo.

### Evidência de jornada visual — 2026-10-09

- [x] Login visual local com veterinária sintética; sessão autenticada exibida no layout.
- [x] Tutor criado pela tela `Tutores`, com confirmação visual de sucesso e persistência na lista.
- [x] Pet criado pela tela do tutor, com espécie/raça, confirmação visual e contador de pets atualizado.
- [x] Formulário de agendamento deixou de exibir opções demonstrativas e passou a carregar serviços ativos do catálogo persistido, com categoria, duração e preço Decimal para apresentação.
- [x] Agendamento criado visualmente para o pet sintético; evento `15:30` apareceu na agenda.
- [x] Corrigido detalhe do tutor quando `createdAt` não é retornado pelo endpoint: a tela agora mostra `Não informado` em vez de quebrar.
- [x] Criada migration local `z_20261009015000_service_result_center`, corrigindo a coluna de classificação necessária ao snapshot do serviço; migration aplicada somente no PostgreSQL Docker local.
- [ ] Transições de atendimento e escrita clínica por clique aguardam confirmação imediata para ações de cuidado; não foram substituídas por chamadas de API nesta evidência.

### Checkpoint 2026-10-08 — descontos persistidos e Decimal

- [x] `InvoiceDiscount` persistido por migration local, com valor Decimal, justificativa obrigatória e usuário autorizador.
- [x] Aplicação restrita a DONO/FINANCEIRO; fatura paga/cancelada, desconto vazio ou acima do subtotal são recusados.
- [x] Total recalculado na mesma transação a partir dos itens e descontos Decimal; tela financeira expõe a operação para faturas pendentes.
- [x] Prova local sintética: item `10.005` armazenado como `10.01`, desconto `5.005` resultou em total `5.01`; limite acima do subtotal foi recusado.
- [x] Frontend build e teste financeiro passaram após incluir o novo hook no mock.
- [ ] Cobertura de pacote na fatura permanece bloqueada por falta de atribuição explícita serviço↔sessão; o sistema não adivinha nem cobra silenciosamente.

### Checkpoint 2026-10-08 — estoque auditável inicial

- [x] `ProductLot` e `StockMovement` persistidos por migration local, com validade, lote, motivo, usuário autorizador e chave idempotente.
- [x] Entradas e saídas transacionais; saída valida lote vencido, saldo do lote, saldo consolidado do produto e atendimento na clínica.
- [x] Rotas protegidas `/api/inventory/lots`, `/movements`, `/receipts` e `/issues`, com separação de leitura/escrita por papel.
- [x] Tela de estoque ganhou entrada por lote; CRUD legado permanece disponível, mas o módulo completo de perdas/devoluções/ajustes e histórico visual ainda é parcial.
- [x] Prova local sintética: entrada repetida com a mesma chave não duplicou, saída reduziu lote e excesso foi recusado; backend 16/100 e frontend 10/81 passaram.
- [x] Navegador local confirmou login, `/operacao`, criação de contrato, consumo de sessão, estorno com justificativa/saldo restaurado e painel `Entrada por lote` em `/estoque`.
- [ ] Jornada tutor→pet→agenda→etapas→cobrança ainda não foi validada integralmente no navegador; a operação de pacote encontrou e agora informa explicitamente duplicidade entre contratos.

## Classificação integral para a execução autônoma — 2026-10-08

### Concluído e validado

- [x] Baseline de backend/frontend, Prisma efetivo, Decimal monetário, PostgreSQL Docker local, backup/restauração e auditoria de produção/dev do npm.
- [x] Isolamento de tenant no proxy Prisma, middleware por requisição, escopos de entidades operacionais e testes locais de leitura/escrita cruzada.
- [x] Catálogo persistido de serviços/pacotes por clínica, com preço Decimal e snapshots de atendimento/contrato.
- [x] Outbox persistente, deduplicação, claim concorrente, retry limitado, pausa/parada e adapter exclusivamente simulado.
- [x] Backend de pacotes com consumo idempotente e concorrente sem saldo negativo.
- [x] Tela `/operacao` básica, login local, catálogo Decimal, preferências e histórico simulado validados no navegador.

### Parcialmente implementado

- [ ] Jornada operacional completa: existem rotas e estados transacionais, mas a UI ainda não cobre cadastro, etapas, pacote e cobrança de ponta a ponta.
- [ ] Pacotes: contrato, consumo, estorno justificado e histórico estão disponíveis na UI, mas usam IDs operacionais e ainda não compõem a jornada visual completa de agenda/cobrança.
- [ ] Cobrança: preços, quantidades, snapshots, descontos autorizados e cobertura explícita de pacote existem; falta validar a jornada integral e o ajuste auditado exigido quando uma sessão já faturada precisa ser revertida.
- [ ] Comunicação: eventos principais existem no backend; horários, telas completas e todos os vínculos clínicos ainda faltam.
- [ ] TenantDataReview: registros ambíguos permanecem corretamente bloqueados, mas a ferramenta de resolução autorizada/auditada não foi entregue.
- [ ] Estoque tem movimentos auditados e UI inicial; prontuário/vacinação e receitas têm persistência/API e partes legadas da UI, mas ainda não estão validados ponta a ponta.

### Pendente

- [ ] Estoque ainda precisa completar consumo visual ligado ao atendimento e operações de devolução/ajuste com fluxo de autorização na UI; lotes, validade, movimentos auditados e histórico já estão implementados.
- [ ] Prontuário/vacinação tem persistência, responsável e lembrete HEALTH simulado; faltam telas clínicas completas e revisão visual integrada. Receitas já têm backend versionado e impressão, faltam telas/revisão ponta a ponta.
- [ ] Especialistas, internação, tarefas assistenciais, cirurgia/consentimentos e separação financeira por centro de resultado.
- [ ] Jornada visual completa e evidência integrada após os incrementos acima.

### Bloqueado, com motivo concreto

- [ ] Migração/validação de produção: sem credenciais ou ambiente de homologação autorizados; somente Docker local é permitido neste escopo.
- [ ] Mensageria real, emissão fiscal e assinatura digital verificável: dependem de provedores, credenciais e decisões/regulamentação externas; permanecem em simulação/documentação.
- [ ] Assinatura digital verificável, receitas controladas e conformidade regulatória: dependem de certificado, provedor e validação jurídica/clínica externa; a impressão atual declara assinatura apenas visual.
- [ ] Dados legados ambíguos: não há fonte autoritativa para escolher clínica; permanecem em `TenantDataReview` e fora da operação normal.

## Checkpoint 2026-10-13 — lembretes persistentes do assistente

- [x] `AssistantReminder` e `AssistantReminderAction` adicionados ao Prisma com chave estável por clínica/ocorrência, status `ACTIVE/SNOOZED/DISMISSED/RESOLVED`, autoria, prazo e histórico; migration `20261013120000_assistant_reminders` aplicada somente no PostgreSQL Docker local.
- [x] Serviço transacional implementa deduplicação, adiamento com reativação após prazo, dispensa e resolução explícitas; a reativação automática registra ação `REACTIVATED`, e ações não alteram a origem (dispensar recebível não paga fatura; resolver é apenas estado do lembrete).
- [x] Rotas protegidas e painel exibem histórico persistente, erros, estado vazio e ações justificadas; o proxy Prisma inclui lembretes e relações no escopo de clínica.
- [x] Evidência automatizada nova: `assistant.reminder.service.test.ts` 2/2 e regressão `assistant.service.test.ts` 1/1; backend build aprovado, frontend build aprovado com `VITE_API_URL=http://127.0.0.1:3334`.
- [ ] Falta validação visual desta nova UI e sincronização explícita de “origem resolvida” a partir de cada módulo de origem; a API já mantém a distinção e não executa a ação de origem.

## Checkpoint 2026-10-13 — PDFs privados e compartilhamento revisável

- [x] PDF contábil e PDF de receita aprovada passaram a ser gerados por rotas autenticadas (`/api/financial/accounting/pdf` e `/api/prescriptions/:id/pdf`), sem URL pública; receita pendente/cancelada é recusada e a versão atual é conferida no backend.
- [x] Dependência avaliada: não havia gerador PDF declarado nem runtime Python PDF disponível; foi adicionada apenas `pdfkit` (com tipos), sem dependência de diálogo de impressão. A fonte embutida usa caminho configurável e fallback local; o aviso separa assinatura visual de verificável.
- [x] Evidência de arquivo real: `pdfinfo` confirmou 1 página, não criptografado e metadados; `pdftotext` confirmou acentuação, totais `R$ 12,34`, período, clínica, versão e conteúdo; `pdftoppm` + inspeção visual confirmou layout sem cortes para resumo contábil e receita.
- [x] `DocumentShare`/`DocumentShareEvent` persistem preparação, prévia, destinatário, fila local simulada e histórico; fila revalida clínica, status aprovado e versão antes de enfileirar. UI clínica ganhou PDF e compartilhamento simulado com revisão/confirmacão local.
- [x] Migration `20261013130000_document_shares` aplicada somente no PostgreSQL Docker local; suíte nova `documentShare.service.test.ts` 2/2, `pdf.service.test.ts` 1/1 e regressões do assistente 3/3 passaram; frontend build local terminou em 1m49s sob carga.
- [ ] Transporte externo/entrega permanecem desativados; compartilhamento visual ainda precisa ser exercitado no navegador nesta sessão. A skill PDF referenciou `mark_artifact_operation_started.mjs`, ausente neste host; geração/inspeção foi feita pelo fallback verificável documentado.

## Evidência adicional — concorrência HTTP local 2026-10-13

- [x] `scripts/real-local/http-concurrency-authenticated.mjs` executado contra `http://127.0.0.1:3334` e banco `eumaeus_local`, com duas clínicas sintéticas e conexões HTTP independentes; resultado persistido em `/tmp/eumaeus-http-concurrency-final.json` (não é artefato do repositório).
- [x] Recebimentos concorrentes: chaves distintas legítimas mantiveram duas operações quando havia saldo; mesma chave manteve uma linha; escrita cruzada retornou 409 sem linha; autoria autenticada persistiu.
- [x] Última sessão de pacote e saída de estoque concorrentes produziram uma operação, sem saldo negativo; estornos concorrentes produziram um estorno e uma auditoria; leitura cruzada retornou 404/coleção vazia conforme o endpoint.
- [ ] Compartilhamento e lembretes ainda não tiveram clique visual nesta sessão porque a aplicação exigiu autenticação e a senha da conta sintética disponível não foi aceita; não alterei contas nem criei credencial adicional para contornar essa proteção. A interface carregou e o bloqueio é de fixture/sessão, não de conectividade.
- [x] O compartilhamento revisável também cobre resumo contábil: prévia limitada por período/centros, destinatário, confirmação no painel e fila simulada persistida pelo mesmo `DocumentShare`; build frontend após essa integração terminou em 1m60s sob carga e backend `tsc` passou.

## Checkpoint 2026-10-09 — vínculo pacote, fatura, estoque e vacinação

- [x] Pacote agora exige `coveredCatalogServiceId`; consumo exige o `Service` concreto do atendimento e valida o catálogo coberto.
- [x] `PackageSession.serviceId` e `InvoiceItem.serviceId/packageSessionId/coveredByPackage` preservam o vínculo e o snapshot histórico.
- [x] Fatura gera item zero para serviço coberto e cobra adicionais normalmente; prova local resultou em `total=12.34` para adicional, com serviço coberto separado.
- [x] Consumo repetido do mesmo contrato retorna a mesma sessão; contrato diferente é recusado; estorno após faturamento é recusado com necessidade de ajuste auditado.
- [x] Estoque ganhou movimentos `ADJUSTMENT`, `LOSS` e `RETURN`, além de histórico visual por produto; entradas/saídas continuam idempotentes e transacionais.
- [x] Vacinação persistida por pet, veterinária responsável, lote, data aplicada e próxima data; próxima data enfileira aviso `HEALTH` simulado na mesma transação.
- [x] Teste automatizado novo de vacinação passou; script local do vínculo financeiro e script local de vacinação passaram; migration local aplicada.
- [ ] UI de consumo de pacote precisa selecionar serviço concreto e ainda não executa a jornada completa de agenda/cobrança; backend está protegido contra omissão/ambiguidade.
- [ ] Sessões legadas sem `serviceId` permanecem fora do faturamento até resolução autorizada; nenhum backfill foi inferido.

## Checkpoint 2026-10-09 — estoque expandido e receitas versionadas

- [x] Rotas protegidas para ajuste, perda e devolução; ajustes exigem papel `DONO`, todos exigem lote, justificativa, chave de idempotência e usuário autorizador.
- [x] Tela `/estoque` exibe entrada por lote, formulário de ajuste/perda/devolução e histórico visual por produto. Prova local sintética cobriu os três tipos, preservou justificativas e repetição da devolução retornou o mesmo movimento.
- [x] `VaccinationRecord` persiste pet, veterinária responsável, lote, aplicação, próxima data e observações; a criação enfileira lembrete `HEALTH` simulado dentro da transação. Teste automatizado e script local passaram.
- [x] Receitas persistem snapshots de clínica/veterinária/tutor/pet, itens versionados, revisão `APPROVED/REJECTED`, cancelamento auditável e impressão HTML para salvar como PDF. O documento declara explicitamente `VISUAL_ONLY`; não há alegação de assinatura digital.
- [x] Atualização de receita aprovada é recusada; itens antigos não são apagados. A impressão escapa dados antes de inserir HTML.
- [ ] A UI de prontuário/vacinação e a experiência de receita ainda não foram validadas ponta a ponta no navegador; permanecem parciais.
- [ ] Jornada completa tutor→pet→agenda→etapas→pacote/cobrança→avisos ainda não foi demonstrada em uma única sessão visual; os vínculos críticos foram validados por API/scripts locais.
- [ ] Especialistas, internação, cirurgia, consentimentos, separação financeira por centro e resolução auditada de `TenantDataReview` continuam pendentes.

## Checkpoint 2026-10-09 — prontuário e receitas persistentes na UI

- [x] `ProntuarioPet` deixou de usar consultas, arquivos e receituários demonstrativos; histórico, ausência, carregamento e erros vêm dos endpoints persistentes.
- [x] A tela permite registrar evolução clínica, registrar vacinação vinculada ao atendimento e consultar lembretes de saúde simulados.
- [x] Receita persistente permite criar/editar rascunho, consultar versões, revisar somente com usuário `VETERINARIO`, preservar aprovação, cancelar com justificativa e imprimir por endpoint autenticado.
- [x] Correção encontrada na validação: criação direta de prontuário enviava data sem horário; passou a persistir `DateTime` completo.
- [x] Prova local com usuário veterinário sintético: atendimento `3`, vacinação `3`, receita `3`, aprovação `APPROVED`, uma versão e impressão com aviso `assinatura visual`.
- [x] Recarregamento visual local confirmou evolução, duas vacinações e receita aprovada persistidas, sem os registros fictícios anteriores na tela.
- [x] Testes novos cobrem permissão de revisão, justificativa de cancelamento e cancelamento sem apagar histórico.
- [ ] A jornada visual de criação ainda foi registrada parcialmente: os dados sintéticos foram criados por API local e confirmados na tela/reload; ações clínicas de escrita não foram simuladas por clique.
- [ ] A jornada operacional completa de tutor/agendamento/pacote/cobrança/recebimento ainda aguarda uma sessão única; não foi classificada como concluída por evidência fragmentada.

## Checkpoint 2026-10-09 — centros de resultado e recebimentos

- [x] `ResultCenter` permite classificar clínica, banho e tosa e loja por empresa; registros antigos sem classificação permanecem nulos, sem backfill silencioso.
- [x] `Payment` registra recebimentos Decimal por fatura, permite pagamentos parciais, impede exceder o saldo, atualiza `PENDING/PAID`, deduplica por chave e registra estorno com justificativa.
- [x] `Expense` fornece base persistente para despesas classificadas por centro; venda/fatura, recebimento e emissão fiscal permanecem entidades distintas.
- [x] Rotas protegidas `/api/financial/centers`, `/invoices/:id/payments` e `/payments/:id/reverse`; emissão fiscal não é acionada por recebimento.
- [x] Prova local: centro `BANHO_TOSA`, recebimentos `5.00 + 7.34`, repetição idempotente e estorno auditado retornando a fatura para `PENDING`.
- [ ] Classificação visual de itens/despesas e tela completa de recebimentos ainda não estão integradas à tela financeira; o backend está utilizável por API.
- [ ] Especialistas, internação e cirurgia permanecem pendentes de implementação; não há base existente suficiente para classificar como concluídos.

## Checkpoint 2026-10-09 — base de especialistas

- [x] Persistidos cadastro de especialista com especialidade informada, registro opcional, repasse configurável e estado ativo.
- [x] Persistidas disponibilidades semanais e associação antecipada a agendamentos, com confirmação e snapshot do repasse.
- [x] Rotas protegidas `/api/specialists`, disponibilidade, assignments e confirmação; relações são validadas no contexto da clínica.
- [x] Migration local `z_20261009014000_specialists` aplicada; prova sintética confirmou disponibilidade, confirmação e bloqueio de associação duplicada.
- [ ] Ainda falta tela operacional para cadastro/disponibilidade/agenda de especialistas e demonstrativo de repasse; o backend é parcial e não inventa especialidades, habilitações ou preços.
- [ ] Internação e cirurgia ainda são pendências de implementação, não bloqueios externos.

### Checkpoint 2026-10-09 — especialista na agenda

- [x] Diálogo de ações da agenda agora lista especialistas ativos e permite associar e confirmar a associação do profissional ao agendamento.
- [x] A operação usa os endpoints protegidos existentes, preserva snapshot de repasse e exibe erros de duplicidade/permissão.
- [x] Build e testes frontend passaram após a integração.
- [ ] A associação ainda não foi exercitada por clique em uma sessão local; permanece pendente essa evidência visual e a implementação das bases de internação/cirurgia.

### Retomada autônoma — 2026-10-09 (continuação)

- [x] A pendência de despesas avançou de backend parcial para fluxo persistente de registro/listagem e formulário visual; ainda falta uma sessão autenticada que submeta a despesa por clique.
- [x] A agenda recebeu controles de associação e confirmação de especialista no diálogo do agendamento, sem inferir especialidade, habilitação ou preço.
- [x] Build frontend, 10 arquivos/81 testes frontend e backend 18 suítes/104 testes permaneceram aprovados após os incrementos.
- [ ] Jornada operacional completa, jornada clínica por cliques, estoque/comunicação completos, internação e cirurgia continuam executáveis e não concluídos.
- [ ] Não há bloqueio externo: a pausa deste lote decorre apenas da necessidade de continuar a validação visual e implementar os módulos ainda ausentes.

### Interrupção técnica de sessão — 2026-10-09

- [x] Ambiente confirmado exclusivamente local: `eumaeus-postgres-local`, banco `eumaeus_local`, endpoint `127.0.0.1:55432`, 19 migrations aplicadas e sem pendências.
- [x] Dados sintéticos confirmados por consulta local: 3 perfis de autenticação de teste e 4 tutores sintéticos; nenhum banco remoto foi acessado.
- [ ] A reabertura da aba local sofreu timeout/reset do controle de navegador antes do login e das novas ações visuais. Não houve evidência de transição clínica, despesa, recebimento ou associação por clique nesta sessão.
- Ponto de retomada: abrir nova aba após os servidores locais estabilizarem, repetir login sintético e validar primeiro `/financeiro`, `/agendamentos` e `/prontuario/4`; depois continuar estoque/comunicação e implementar internação/cirurgia.

### Checkpoint 2026-10-09 — despesas classificadas

- [x] Endpoints protegidos `/api/financial/expenses` permitem listar e registrar despesas com valor Decimal, justificativa obrigatória e centro de resultado ativo.
- [x] Tela `/financeiro` agora apresenta formulário de despesa, seleção de centro, validação de campos e histórico persistido; registros sem centro permanecem explicitamente identificados.
- [x] Teste de compilação e suíte financeira/frontend aprovados após a integração; não foram adicionados dados demonstrativos como fallback.
- [ ] Ainda falta validar por clique o envio de uma despesa e o fluxo visual completo de recebimento/estorno em uma sessão local autenticada.

### Checkpoint 2026-10-09 — base de internação e cirurgia

- [x] Migração aditiva `z_20261009021000_hospitalization_surgery_base` aplicada somente no PostgreSQL Docker local; não aceitou o drift que tentaria remover `TenantDataReview`.
- [x] Internação persistente cobre admissão, responsável, tarefas com execução real auditada, prescrições inseridas pela veterinária, passagem de responsabilidade e alta revisada. O sistema não marca medicação automaticamente e não sugere protocolos.
- [x] Cirurgia persistente cobre agendamento, orçamento versionado Decimal, consentimento vinculado à versão, checklist e orientações aprovadas pela veterinária. Não há protocolo clínico, assinatura jurídica ou especialidade/preço inventado.
- [x] Testes novos `care.service.test.ts` cobrem contexto obrigatório, responsável ativo e incremento de versão de orçamento; build backend aprovado.
- [x] Prova HTTP local sintética: health/login, GET/POST de internação e GET corrigido após detectar Promise serializada como `{}`; criação de cirurgia e orçamento `125.50` persistidos e retornados como Decimal serializado.
- [x] Existe a tela protegida `/assistencia`; a base permanece parcial apenas para validação de escritas clínicas por clique e para ações avançadas que aguardam confirmação.
- [x] Rota protegida `/assistencia` agora expõe uma tela mínima para consultar internações/cirurgias e iniciar admissão ou planejamento, com estados de carregamento, erro e vazio. Não substitui revisão clínica nem valida protocolos.
- [x] O diagnóstico inicial de indisponibilidade foi superado em nova sessão: frontend/backend responderam localmente e `/assistencia` foi lida pela interface. O incidente anterior foi AX tree vazia/nenhum campo e geração incompatível do Prisma Client; o cliente foi regenerado com Prisma local 5.22.
- [x] Frontend passou novamente: 10 arquivos/81 testes e build com o bundle `CarePage`; backend passou build e teste específico de cuidado.
- [x] Auditoria visual da tela `/assistencia` em sessão nova: login sintético, consulta de uma internação e de uma cirurgia; a tela exibe controles de tarefa, execução real, prescrição, passagem, alta, orçamento versionado, consentimento, checklist e orientação.
- [ ] Os botões de gravação clínica foram preparados, mas não acionados: permanecem aguardando confirmação imediatamente anterior conforme a política de Computer Use.
- [x] Validação clínica autorizada e específica executada: na sessão local sintética, a internação `#1` recebeu pela interface a tarefa `Tarefa operacional sintética`, com observação `Teste local autorizado`; a tela mostrou confirmação e estado `PENDING`, confirmado também por GET autenticado.
- [x] Execução real da tarefa sintética `id=1` foi acionada uma única vez após confirmação específica; prescrição, passagem, alta, checklist, consentimento e aprovação de orientação continuam sem clique e requerem confirmações próprias.
- [x] Próximo teste preparado sem efeito colateral: internação `#1` selecionada e tarefa `Tarefa operacional sintética · PENDING` visível com o botão `Registrar execução real`.
- [x] Ação confirmada e executada: clique em `Registrar execução real` para a tarefa `id=1`; a interface exibiu `Tarefa marcada como executada.` e o estado mudou para `EXECUTED`.
- [x] Persistência confirmada por GET autenticado: `executedAt=2026-10-10T15:12:15.602Z`, `executedById=4`, observação sintética preservada.

### Matriz de evidências — 2026-10-10

| Área | Implementado | Testado por HTTP/automação | Validado pela interface | Estado |
| --- | --- | --- | --- | --- |
| Internação/cirurgia | Sim, incluindo operações da tela | Sim; 6 testes novos de cuidado e prova HTTP local | Leitura e execução real da tarefa `id=1` confirmadas; demais escritas não acionadas | Parcial; confirmações clínicas pendentes |
| Financeiro | Sim, com despesas, recebimentos e estorno | Sim, provas e testes anteriores | Leitura e persistência após reload confirmadas; mutações aguardam confirmação | Parcial; escrita visual pendente |
| Especialistas/agenda | Sim, associação e confirmação | Sim, provas anteriores | Controles exibidos na agenda; clique de mutação aguarda confirmação | Parcial; escrita visual pendente |
| Estoque | Sim, lotes, movimentos e histórico | Sim | Tela montada; validação visual completa pendente | Sem bloqueio técnico |
| Comunicação | Simulação persistente | Sim | Histórico/preferências visuais pendentes | Sem envio real |

### Evidências visuais administrativas — 2026-10-10

- [x] `/financeiro`: sessão veterinária sintética exibiu centros de resultado, formulário de despesa, contas a receber, histórico de recebimentos (`POSTED`/`REVERSED`) e ações de pagamento/desconto/estorno. Nenhuma transação financeira foi executada nesta validação.
- [x] `/especialistas`: exibiu cadastro, disponibilidade, especialista persistido e repasse informado; a associação na agenda ficou disponível no diálogo do agendamento.
- [x] `/estoque`: exibiu entrada por lote, validade, justificativa e controles de ajuste/perda/devolução.
- [x] `/operacao`: após corrigir permissão de leitura para `VETERINARIO`, exibiu histórico simulado do tutor `2`, pacotes persistidos e contrato `5` com saldo `2/2`; consumo/estorno não foram executados.
- [x] Reload financeiro na sessão nova preservou os recebimentos `R$ 7,34 · POSTED` e `R$ 5,00 · REVERSED`; não houve mutação financeira nesta rodada.
- [x] `/agendamentos` exibiu o calendário e os controles de associação/confirmação de especialista; nenhum clique de alteração foi feito.
- [x] `/operacao` exibiu controles de preferências, pacotes, contrato e comunicação simulada; nenhum consumo, estorno ou alteração de preferência foi feito.
- [x] A correção de permissão mantém escrita de preferências e dispatch de simulação restritos a `DONO/RECEPCAO`; veterinário recebeu somente leitura de preferências/histórico.
- [x] Diagnóstico de sessão local reproduzível: `GET http://127.0.0.1:3333/health` retornou `application=ok` e `database=ok`; `HEAD http://127.0.0.1:4173/login` retornou `200`; o banco está no container `eumaeus-postgres-local` publicado em `127.0.0.1:55432`.
- [x] Verificação direcionada deste checkpoint: `care.service.test.ts` passou com 6/6 cenários e `Financeiro.test.tsx` passou com 1/1. A tentativa das suítes completas ficou sem progresso por mais de um minuto e foi interrompida com `SIGINT`; ela não é contada como aprovação nem como falha funcional.
- [x] Diagnóstico isolado posterior: a suíte completa do backend terminou em 33,457 s com 19 suítes/110 testes aprovados; a suíte completa do frontend terminou em 18,07 s com 10 arquivos/81 testes aprovados. O episódio anterior foi lentidão/saída tardia, não travamento reproduzido.
- [x] Próxima ação clínica preparada, sem clique: internação `#1`, botão `Registrar prescrição`, medicamento `TESTE-SINTETICO-NAO-CLINICO` e instruções `Somente validação local; não representa orientação clínica real`.
- [x] Ação clínica confirmada e executada uma única vez: `Registrar prescrição` na internação sintética `#1`, com os dados acima; a interface exibiu `Prescrição registrada.`.
- [x] Persistência confirmada após reload: a linha local `HospitalizationPrescription id=1` permaneceu associada a `admissionId=1`, `clinicId=1`, com medicamento e instruções preservados; a tela passou a exibir a prescrição ao selecionar novamente a internação.
- [x] Correção aplicada: `CarePage` agora tipa e renderiza prescrições retornadas pelo endpoint de internações, evitando que um registro persistido desapareça da interface após recarregar.
- [x] Verificação pós-correção: build frontend concluído em 35,83 s e teste financeiro direcionado passou com 1/1.

### Retomada da equipe autônoma — 2026-10-10

Coordenação executada sequencialmente nesta sessão para evitar concorrência em uma única worktree, banco sintético e sessão de navegador. A ausência de agentes paralelos não bloqueia o trabalho.

| Critério | Situação atual | Evidência | Próximo passo seguro |
| --- | --- | --- | --- |
| Internação/prescrição | Implementado e validado por clique | Registro `HospitalizationPrescription id=1`, `clinicId=1`, reload e exibição corrigida | Nova escrita clínica exige confirmação específica |
| Financeiro | Backend e tela disponíveis; escrita visual parcial | Recebimentos persistem após reload; despesa e estorno visíveis | Confirmar imediatamente antes de mutação [11] |
| Pacotes | Backend e controles visíveis | Contrato sintético `5`, saldo `2/2` | Consumo/estorno exige confirmação [11] |
| Especialistas/agenda | Associação e confirmação implementadas | Controles exibidos na agenda | Alteração de agenda exige confirmação [9] |
| Comunicação | Simulação persistente implementada | Histórico simulado visível | Alterar preferências exige confirmação [10] |
| Testes | Aprovados | Backend 19/110, frontend 10/81, build frontend aprovado | Continuar testes específicos de novas mutações |

Confirmações pendentes preparadas: registrar despesa/recebimento/estorno financeiro; consumir ou estornar sessão do contrato `5`; associar e confirmar `Dra. Synthetic Vet` no agendamento sintético; alterar preferência do tutor sintético. Nenhuma dessas mutações foi executada nesta retomada.

### Preparação da primeira ação administrativa — 2026-10-10

- Tela: `/financeiro`, perfil sintético autenticado `Dra. Synthetic Vet` (`VETERINARIO`), ambiente local.
- Registro afetado: criação de uma nova despesa; a tela informou `Nenhuma despesa registrada`, portanto não há sobrescrita de registro existente.
- Campos preenchidos, ainda não enviados: descrição `Despesa teste local - insumo`; valor `10.00`; centro `BANHO_TOSA · Banho e tosa`; justificativa `Validação administrativa local sintética`.
- Efeito esperado: criar uma despesa persistida de `R$ 10,00`, classificada no centro `BANHO_TOSA`, com justificativa auditável; nenhum recebimento, fatura ou documento fiscal será criado.
- Regra aplicável: o clique em `Registrar despesa` altera dado financeiro e requer confirmação imediatamente anterior pela política Computer Use `[11]` (confirmação de transações financeiras). O botão não foi acionado.
- Verificações independentes: `test:policy` passou; `eslint src/pages/CarePage.tsx` passou. A execução completa de `npm run lint` foi interrompida após mais de um minuto sem saída; isso é diagnóstico de lentidão, não aprovação nem falha funcional.

### Resultado da primeira ação administrativa — 2026-10-10

- O clique confirmado em `Registrar despesa` foi executado uma única vez na tela `/financeiro` com o perfil sintético `Dra. Synthetic Vet` (`VETERINARIO`) e os quatro campos preparados acima.
- Resultado visual: `Forbidden`.
- A autorização efetiva permanece correta: `POST /api/financial/expenses` usa `requireRoles(DONO, FINANCEIRO)`; `VETERINARIO` possui somente leitura. Nenhuma permissão foi ampliada.
- Persistência/duplicação: consulta local encontrou `0` linhas com a descrição `Despesa teste local - insumo` antes/depois do clique; não houve despesa duplicada.
- Auditoria: a rejeição foi observada como resposta `403` da aplicação, mas não existe evento persistido de auditoria para negativas de RBAC no schema atual. Isso fica registrado como lacuna independente, sem transformar o teste autorizado em sucesso artificial.
- O controle do navegador resetou ao tentar coletar a tela após o `403`; não houve repetição do clique. A evidência de autorização e ausência de persistência foi complementada por inspeção do código de rota e consulta ao PostgreSQL local.
- Diagnóstico adicional: `auth.middleware.security.test.ts` ficou sem saída por mais de 60 s nesta execução isolada e foi interrompido; não é contado como aprovado. O teste de política continuou aprovado.

### Preparação autorizada após fixture local — 2026-10-10

- O `backend/dist/prisma/seed.js` foi executado uma vez contra `postgresql://127.0.0.1:55432/eumaeus_local` com `ALLOW_TEST_DATA_MUTATION=true` e senha temporária efêmera. O primeiro intento TypeScript foi inconclusivo por mais de 90 s; o primeiro intento compilado falhou sem `DATABASE_URL`; nenhum deles alterou dados.
- A execução compilada com credenciais do container concluiu e criou somente identidades sintéticas ausentes, incluindo `financeiro@eumaeus.com` com papel `FINANCEIRO`; as contas existentes não foram atualizadas. A senha temporária não foi registrada em logs ou documentação e foi descartada após uso.
- Após logout explícito da sessão `VETERINARIO`, login local mostrou `Ana Costa`/`FINANCEIRO`. A mesma despesa foi preparada visualmente em `/financeiro`: descrição `Despesa teste local - insumo`, valor `10.00`, centro `BANHO_TOSA · Banho e tosa`, justificativa `Validação administrativa local sintética`.
- O botão `Registrar despesa` está pronto, mas não foi clicado. Próximo passo exige confirmação [11] imediatamente antes da transação financeira.

### Ajuste de autorização na interface — 2026-10-10

- `Financeiro.tsx` agora lê o perfil autenticado e só renderiza o formulário `Registrar despesa` para `DONO` ou `FINANCEIRO`; `VETERINARIO` recebe mensagem explícita de somente leitura. A proteção de rota/backend permanece inalterada.
- O teste focal de `Financeiro.test.tsx` foi tentado com um worker e limite de 45 s, mas não produziu resultado antes do timeout; o processo órfão foi encerrado. O build frontend também excedeu 60 s sem conclusão durante carga elevada. Nenhum dos dois é contado como aprovado ou falho funcional.
- A frente frontend delegada iniciou e produziu `870d873` em base divergente; revisão mostrou que não é compatível para cherry-pick automático. A frente backend não iniciou trabalho observável nem produziu commit; o coordenador assumiu a revisão backend.

### Resultado da despesa FINANCEIRO — 2026-10-10

- [x] Confirmação específica consumida uma única vez: na sessão local sintética autenticada como `FINANCEIRO` (`Ana Costa`), o botão `Registrar despesa` foi acionado com descrição `Despesa teste local - insumo`, valor `R$ 10,00`, centro `BANHO_TOSA` e justificativa `Validação administrativa local sintética`.
- [x] A interface exibiu a nova linha e limpou o formulário após a submissão. Depois de recarregar `/financeiro`, a consulta visual encontrou exatamente uma linha correspondente (`rows=1`); nenhum segundo clique foi feito.
- [x] PostgreSQL Docker local confirmou exatamente um registro: `Expense.id=1`, `clinicId=1`, `amount=10.00`, `resultCenter=1/BANHO_TOSA`, descrição e justificativa preservadas. A contagem por descrição permaneceu `1` após o reload.
- [ ] Autoria não está persistida no modelo atual: as colunas de `Expense` são `id`, `createdAt`, `clinicId`, `description`, `amount`, `resultCenterId`, `incurredAt` e `reason`; não há `createdById` nem evento de auditoria associado. Isso é uma lacuna de implementação, não foi preenchida por inferência.
- [ ] Recebimento, quitação, estorno, pacotes e associação de especialista continuam sem mutação visual nesta rodada; exigem confirmações específicas próprias e não podem reutilizar esta autorização.
- [x] Verificação independente pós-checkpoint: `npm run test:policy` passou, inspecionando 495 arquivos e 0 blobs de commit novos; os casos negativos em memória também passaram.

### Autoria e auditoria financeira — 2026-10-10

- [x] `Expense.createdById` foi adicionado como relação opcional com `User`; despesas legadas permanecem com `NULL`, sem atribuição silenciosa. A criação rejeita ausência de usuário no contexto autenticado e ignora qualquer autoria enviada pelo cliente.
- [x] O contexto de autenticação agora propaga `clinicId` e `userId` via `AsyncLocalStorage`; a rota financeira usa esse contexto para gravar autoria e centro da própria clínica.
- [x] `FinancialAuditEvent` registra `EXPENSE_CREATED` na mesma transação que cria a despesa, com `clinicId`, `actorUserId`, `expenseId` e metadados mínimos de valor/centro. Falha no evento propaga erro e invalida a transação.
- [x] Migration local `z_20261010030000_expense_authorship_audit` aplicada no PostgreSQL Docker; `Expense.id=1` permaneceu com `createdById=NULL` e a tabela de auditoria iniciou sem eventos, preservando o legado.
- [x] Teste novo focal: 3/3 cenários aprovados para autoria derivada, ausência de contexto/cliente e rollback lógico quando a auditoria falha. Build backend aprovado.
- [ ] Ainda falta prova HTTP com uma nova despesa e consulta autenticada do evento; a despesa `id=1` não será repetida. A validação visual anterior permanece evidência da escrita antiga sem autoria.

### Próximo recebimento preparado — 2026-10-10

- Fatura local `id=4`, `clinicId=1`, total `R$ 12,34`, recebido `R$ 7,34`, saldo atual `R$ 5,00`, status `PENDING`.
- Perfil sintético: `FINANCEIRO`; valor preparado `R$ 5,00`; forma `PIX`; efeito esperado: criar um único recebimento `POSTED`, atualizar a fatura para `PAID` e zerar o saldo, sem emitir documento fiscal.
- O recebimento ainda não foi executado. Requer confirmação específica imediatamente antes do clique; nenhuma autorização anterior foi reutilizada.

### Diagnóstico e correção do recebimento visual — 2026-10-10

- [x] Antes da ação, a interface mostrou a fatura `#4` com total `R$ 12,34`, `R$ 7,34 · POSTED` e `R$ 5,00 · REVERSED`; portanto o saldo conferido permaneceu `R$ 5,00`.
- [ ] A submissão antiga não foi concluída: o console local registrou `prompt() is not supported` em `Financeiro.tsx`; não houve mutação, recebimento novo ou alteração da fatura.
- [x] A tela foi corrigida para substituir `window.prompt` por formulário visual acessível, com fatura, valor, forma de pagamento e botões explícitos. Build frontend concluído em 27,11 s.
- [x] Formulário preparado visualmente para a fatura `#4`: `R$ 5,00`, `PIX`, perfil `FINANCEIRO`; ainda sem submissão.
- [ ] A confirmação anterior não será reutilizada para o novo botão; a ação permanece aguardando confirmação específica imediatamente antes do clique.

### Recebimento visual validado — 2026-10-10

- [x] Antes do clique, a fatura `#4` estava `PENDING`, com total `R$ 12,34`, apenas `R$ 7,34` em pagamentos `POSTED` e saldo `R$ 5,00`; a tentativa anterior não criou pagamento novo.
- [x] O formulário corrigido foi submetido uma única vez com `R$ 5,00` e `PIX`, na sessão local sintética `FINANCEIRO`.
- [x] Após reload, a interface mostrou `Pago` e `R$ 5,00 · POSTED`. PostgreSQL confirmou `Payment.id=3`, `clinicId=1`, `amount=5.00`, `method=PIX`, `status=POSTED`, idempotency key `ui-payment-4-5-PIX`; fatura `#4` ficou `PAID`, recebido `R$ 12,34`, saldo `R$ 0,00`.
- [ ] O modelo `Payment` atual não tem `receivedByUserId` nem evento de auditoria de recebimento. A autoria deste pagamento não foi inferida retroativamente; fica pendente migration aditiva para próximas operações, preservando o legado.

### Autoria futura de pagamentos — 2026-10-10

- [x] Migration local `z_20261010031000_payment_authorship_audit` adicionou `Payment.receivedByUserId` opcional e `FinancialAuditEvent.paymentId`; o pagamento já validado `Payment.id=3` permaneceu com autoria `NULL`, sem atribuição retroativa.
- [x] Novos recebimentos agora exigem usuário autenticado, persistem o autor do contexto e gravam `PAYMENT_RECEIVED` na mesma transação. Estornos autenticados gravam `PAYMENT_REVERSED` transacionalmente.
- [x] Testes focais ampliados para 5/5 aprovados: autoria/auditoria de despesa, rejeição sem contexto, rollback de auditoria, autoria de recebimento e rejeição de recebimento sem contexto. Build backend aprovado.

### Quitação e próximo cenário financeiro — 2026-10-10

- [x] Quitação da fatura `#4` registrada como validada. `Payment.id=3` permanece `POSTED` e com `receivedByUserId=NULL`; não houve backfill de autoria.
- [x] Suíte focal do formulário corrigido `Financeiro.test.tsx`: 1/1 aprovada. Build frontend concluído; a tela não usa mais `window.prompt` para recebimentos.
- [x] Cenário sintético seguinte verificado no PostgreSQL local sem mutação: fatura `#2`, `clinicId=1`, total `R$ 5,01`, status `PENDING`, nenhum pagamento e saldo `R$ 5,01`.
- [ ] Preparação para confirmação: perfil `FINANCEIRO`, valor `R$ 5,01`, forma `PIX`, efeito esperado `Payment` `POSTED` com `receivedByUserId` do usuário autenticado, evento `PAYMENT_RECEIVED`, fatura `#2` `PAID` e saldo `R$ 0,00`. Nenhum clique foi executado.
- [ ] O estorno do novo pagamento será preparado somente após a confirmação e persistência desse recebimento, com justificativa explícita e evento `PAYMENT_REVERSED`.

### Tentativa do recebimento da fatura #2 — 2026-10-11

- [x] Pré-condições confirmadas: fatura `#2`, `clinicId=1`, `PENDING`, saldo `R$ 5,01`, zero pagamentos; a única submissão foi feita com `R$ 5,01` e `PIX` sintético.
- [ ] Resultado: falha sem mutação observável. A interface permaneceu `Pendente`/`Nenhum` e o PostgreSQL confirmou zero pagamentos para a fatura `#2`; não preparar estorno de um pagamento inexistente.
- [x] Correção defensiva na tela: o formulário agora só fecha em `onSuccess` e mantém/exibe o erro da API quando a mutation falha, evitando perda silenciosa dos dados preparados.
- [ ] Diagnóstico do erro de backend ainda pendente; não houve repetição do clique nem nova tentativa financeira nesta sessão.

### Diagnóstico da tentativa #2 — 2026-10-11

- [x] Não houve novo POST durante o diagnóstico. O banco local confirmou `Invoice #2` ainda `PENDING`, saldo `R$ 5,01`, zero `Payment` e zero auditorias vinculadas.
- [x] A interface não expôs o status/resposta porque a mutation anterior fechava o formulário imediatamente; não há captura confiável do status HTTP daquela tentativa. Pelo controller, erros de `receive` são mapeados para HTTP `409` com corpo `{ error }`.
- [x] Evidência operacional da causa: o processo backend que atendia a tentativa tinha mais de 11 horas e foi iniciado antes da regeneração do Prisma Client. Após reinício local com o client gerado para o schema das migrations 21/22, `/health` retornou `application=ok` e `database=ok`.
- [x] Schema local verificado: migrations 22/22 aplicadas; `Payment.receivedByUserId` e `FinancialAuditEvent.paymentId` existem. Não houve acesso remoto.
- [x] Regressão adicionada: `financial.service.test.ts` passou com 6/6, incluindo autoria autenticada, `PAYMENT_RECEIVED` transacional e rollback quando a auditoria falha. Build backend passou.
- [x] Após o reinício, a tela local foi aberta como `Ana Costa`/`FINANCEIRO`; `#2` permaneceu `R$ 5,01`/`Nenhum` e o formulário foi preparado com `R$ 5,01`/`PIX`, sem submissão.
- [ ] A nova submissão requer confirmação específica; estorno continua não preparado enquanto não existir pagamento persistido.

### Recebimento #2 validado e estorno preparado — 2026-10-11

- [x] Pré-condições confirmadas antes do clique: `Invoice #2`, `clinicId=1`, `PENDING`, saldo `R$ 5,01`, zero pagamentos; sessão visual como `Ana Costa`/`FINANCEIRO`.
- [x] Submissão executada uma única vez com `R$ 5,01`/`PIX`. Após reload, a interface mostrou `Pago` e `R$ 5,01 · POSTED`.
- [x] Banco local confirmou `Payment.id=4`, `amount=5.01`, `status=POSTED`, `clinicId=1`, `receivedByUserId=10` (`Ana Costa`, `FINANCEIRO`), idempotência `ui-payment-2-5.01-PIX`; evento `FinancialAuditEvent.id=1`, `eventType=PAYMENT_RECEIVED`, `paymentId=4`, `clinicId=1`, `actorUserId=10`.
- [x] Fatura `#2` ficou `PAID`, recebido `R$ 5,01`, saldo `R$ 0,00`, sem duplicação.
- [x] Estorno preparado visualmente, sem submissão: pagamento `#4`, valor `R$ 5,01`, justificativa `Estorno sintético para validar auditoria e recálculo local`.
- [ ] O botão `Registrar estorno` aguarda confirmação específica; não executar antes dela.

### Estorno Payment #4 validado — 2026-10-11

- [x] Pré-condições confirmadas: `Payment #4` `POSTED`, fatura `#2` `PAID`, clínica `1`, saldo zero.
- [x] Clique único executado na interface com justificativa `Estorno sintético para validar auditoria e recálculo local`.
- [x] Após reload visual, pagamento apareceu como `R$ 5,01 · REVERSED` e a fatura como `Pendente`.
- [x] Banco local confirmou `Payment.id=4`, valor `5.01`, `REVERSED`, justificativa preservada, `receivedByUserId=10` (`Ana Costa`/`FINANCEIRO`); evento `PAYMENT_REVERSED`, `paymentId=4`, `clinicId=1`, `actorUserId=10`.
- [x] Fatura `#2` ficou `PENDING`, recebido líquido `R$ 0,00`, saldo `R$ 5,01`; histórico `PAYMENT_RECEIVED` e `PAYMENT_REVERSED` preservado, sem duplicação.
- [ ] Próximas frentes independentes: pacotes/consumo concorrente, agenda/especialistas, estoque e comunicação; nenhum estorno adicional deve reutilizar esta confirmação.

### Pacotes: invariantes de consumo e estorno — 2026-10-11

- [x] Foi adicionado `backend/src/__tests__/package.service.test.ts` com cinco cenários novos: consumo somente do serviço contratado, rejeição de serviço fora da cobertura antes do decremento, recusa de decremento concorrente, bloqueio de estorno já refletido em fatura e estorno auditável de sessão não faturada com restauração do saldo.
- [x] O teste verifica o vínculo explícito `packageContract → packageSession → appointment/service` e que a sessão não é criada quando o serviço do agendamento não corresponde ao catálogo coberto.
- [x] Execução focal: pacote `5/5` e financeiro `6/6` aprovados; build backend aprovado. A primeira tentativa sem saída foi inconclusiva durante o aquecimento do transformador e não foi contada como aprovação.
- [ ] A validação por cliques de consumir/estornar sessão ainda aguarda preparação e confirmação específica imediatamente antes da mutação; nenhuma sessão sintética foi alterada neste checkpoint.
- [ ] Próxima frente executável: revisar associação de especialista à agenda e seus testes de permissão/idempotência; depois seguir estoque e comunicação.

### Especialistas: isolamento e confirmação na agenda — 2026-10-11

- [x] Disponibilidade agora confirma no servidor que o especialista ativo pertence à clínica autenticada antes de criar o horário; o proxy continua impondo `clinicId` no registro criado.
- [x] Confirmação consulta a associação dentro do contexto da clínica antes de atualizar; associação inexistente ou cruzada é rejeitada e uma associação já `CONFIRMED` é idempotente.
- [x] Quatro testes novos aprovados: disponibilidade cruzada, associação da mesma clínica com rejeição de duplicata, confirmação cruzada e confirmação idempotente. Build backend aprovado.
- [ ] A validação visual de associar/confirmar ainda não foi executada; endpoints/testes não contam como validação por interface e qualquer mutação visual exige confirmação específica.

### Comunicação: outbox e preferências — 2026-10-11

- [x] Cinco testes novos aprovados: deduplicação por `dedupeKey`, cancelamento quando a preferência é revogada após enfileirar, claim único entre workers, retry limitado com re-enfileiramento e adapter exclusivamente simulado após revalidação da preferência.
- [x] A tela/serviço permanece sem envio real; o adapter de dispatch não foi conectado a WhatsApp, e-mail ou outro provedor.
- [x] Build backend aprovado. A primeira falha da suíte foi apenas um mock ausente de `tutorCommunicationPreference`; após completar o setup, `5/5` passaram.
- [ ] Ainda falta validação visual da configuração/histórico e uma prova de persistência pós-reload; não será simulada por API como se fosse interface.

### Preferências de comunicação — correção de atualização parcial — 2026-10-12

- [x] Hipótese confirmada: `upsertPreference` reativava uma preferência desabilitada e removia pausa/parada total quando o cliente enviava somente um campo.
- [x] Serviço e controller agora preservam campos omitidos; `null` explícito continua permitindo limpar pausa. Regressão de comunicação: `6/6` aprovados; build backend aprovado.
- [ ] A validação visual e o histórico pós-reload continuam pendentes; o adapter segue exclusivamente simulado e não há envio externo.
- [x] Retry do worker agora agenda `availableAt` com backoff exponencial limitado a 60s; falha exaurida permanece `FAILED` sem re-enfileirar. O teste de comunicação `6/6` continua aprovado.
- [x] O client da tela assistencial deixou de transmitir `createdById` ao registrar prescrição; a API filtra o campo e envia somente conteúdo clínico, mantendo autoria exclusivamente no servidor.
- [x] Regressão integrada desta rodada: pacotes `5/5`, especialistas `4/4` e comunicação `6/6` aprovados no backend; nenhum teste alterou produção ou banco remoto.

### Escritório Dev — evidências integradas e WhatsApp local — 2026-10-12

- [x] Três subagentes realmente executaram frentes disjuntas: PostgreSQL real (`1e70316`), WhatsApp local (`b64d104`) e frontend administrativo (`1eaf9c4`). O coordenador revisou os commits e executou as verificações finais.
- [x] Prova PostgreSQL real repetida com sucesso: duas clínicas sintéticas `9101/9102`, leitura cruzada bloqueada, chaves iguais independentes por clínica e rollback real de auditoria. Execução protegida para aceitar somente o container `eumaeus-postgres-local`.
- [x] WhatsApp avançou de “pendente” para “implementação local simulada”: adapter, configuração sem segredos, HMAC `X-Hub-Signature-256`, deduplicação e estados `accepted/delivered/failed`. O contrato não abre conexão externa.
- [x] Teste WhatsApp focal: `4/4`; build backend aprovado. A implementação segue alinhada ao fluxo oficial de webhook Meta: handshake com verify token e validação HMAC antes de aceitar POST. Referência consultada: documentação do SDK oficial arquivado em `whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/`.
- [x] Frontend administrativo recebeu validação de campos, loading/error/empty, chaves idempotentes de estoque, remoção de autoria do payload clínico e bloqueio de ações incompletas. Build frontend aprovado; o agente reportou `18` testes focais aprovados e lint sem erros além de warnings preexistentes.
- [ ] Ainda pendente: ligar o adapter simulado à outbox persistente sem envio externo, criar endpoint autenticado de webhook no bootstrap e testar estados em PostgreSQL; não expor endpoint público sem autenticação/verificação.
- [ ] Ainda pendente: validação por cliques no navegador, jornada integrada tutor→pet→agenda→atendimento→pacote/cobrança e validação visual pós-reload. Build/teste não substituem interface.
- [ ] Ainda pendente: concorrência real de pagamentos, consumo de pacote e estoque em cenários isolados completos; a prova atual cobre isolamento, idempotência e rollback de auditoria, não todas as corridas de negócio.
- [x] A suíte frontend foi diagnosticada e fechada: `npm test` sem `--run` entrava em watch; a execução não interativa com `--run`, um worker e relatório persistido aprovou `10` arquivos / `81` testes em `44,41s`, sem processos residuais. Os `18` testes reportados anteriormente não foram somados como evidência independente.

### Integração e concorrência — retomada a partir de `d011ee1` — 2026-10-12

- [x] Auditoria frontend fechada: a causa da inconclusividade era `npm test` entrar em modo watch. Execução não interativa serial aprovou `81/81` testes em `10` arquivos, sem processos residuais; o relatório foi salvo em `reports/private/` e não é versionado. O commit `9281394` registra a evidência.
- [x] Webhook WhatsApp montado no bootstrap antes de `express.json()`, preservando bytes originais: `/webhooks/whatsapp/:channelId`. Handshake Meta, HMAC, canal confiável (`channelId → clinicId`), rejeição de configuração/canal/contato inválido e persistência durável na outbox estão cobertos por `17/17` testes WhatsApp/financeiros no lote de integração.
- [x] Referência primária atual consultada: [Meta Webhooks Getting Started](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) e [referência atual de mensagens WhatsApp](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages). O contrato exige `hub.challenge`, `hub.verify_token` e `X-Hub-Signature-256`; a rota não confia em `clinicId` do payload.
- [x] Concorrência real PostgreSQL corrigida e repetida com conexões independentes: recebimento concorrente mantém uma linha e total correto; mesma chave mantém uma linha; parcelas iguais com chaves distintas mantêm duas; última sessão do pacote e estoque insuficiente não geram saldo negativo; estorno concorrente deixa uma reversão lógica. Runner retorna `ok=true`, fixtures removidas.
- [x] Serviço financeiro usa lock de linha da fatura via SQL raw allowlisted, transação `Serializable` e estorno condicional `status=POSTED`. Regressão mockada financeira: `8/8`; build backend aprovado.
- [ ] Pendente: o webhook persiste inbound na `CommunicationOutbox` como registro `RECEIVED`, mas ainda não há modelo histórico inbound dedicado nem worker que transforme todos os status do provedor em estado agregado persistido. A implementação é local/simulada; nenhum envio externo foi validado.
- [ ] Pendente: validação HTTP end-to-end contra servidor backend em execução, incluindo reinício do processo e confirmação de deduplicação após reinício; os testes de rota usam store controlado e a prova PostgreSQL usa scripts independentes.
- [x] Validação HTTP local executada no commit integrado: `GET /webhooks/whatsapp/synthetic-9301` devolveu `200` e `hub.challenge`; POST Meta sintético assinado com bytes crus devolveu `200` e `outboxId=24`; repetição devolveu o mesmo ID; assinatura inválida devolveu `401`; após reinício do backend, a repetição continuou com exatamente uma linha persistida. A fixture sintética foi removida depois.
- [ ] O teste HTTP usou canal/tutor locais e não valida credencial Meta, entrega externa ou mensagem real. Esses estados permanecem dependentes de acesso externo e fora da autorização atual.

### Diagnóstico visual e frontend — 2026-10-11

- [x] Nova aba suportada carregou `http://127.0.0.1:4173/login` com resposta HTTP local e árvore acessível completa (`Email`, `Senha`, `Entrar`). O bloqueio anterior foi do controle/sessão do navegador, não indisponibilidade da aplicação.
- [ ] Login e mutações visuais não foram executados neste checkpoint: não há credencial sintética aberta para inventar e não foram usadas APIs para substituir cliques.
- [ ] O teste frontend de `Financeiro` iniciou mas não produziu resultado dentro de dois limites curtos; processos órfãos específicos foram encerrados. O build frontend chegou a `2673 modules transformed` e `rendering chunks`, mas não concluiu sob carga. Ambos permanecem inconclusivos, não aprovados.
- [x] Nesta worktree, `npm run build` do frontend concluiu e gerou `dist/index.html` (artefato ignorado). `Financeiro.test.tsx` passou em execução isolada com um worker: `1` arquivo / `1` teste / `4,85s`.
- [ ] A primeira execução sem limitação de workers excedeu 60s sem saída; classificada como inconclusiva por carga/concorrência do ambiente, não como falha funcional. A execução controlada posterior é a evidência válida.

### Continuidade no Escritório Dev local — 2026-10-12

- [x] Nova worktree `/media/giovanni/HD/Projetos/Eumaeus-dev` criada a partir da `origin/main` publicada (`661d574bf8460573c4f8c6ce543938b57b3d05b3`); a worktree original e seus commits permanecem intactos.
- [x] `docs/DEV_OFFICE.md` registra escopos, limites, critérios de aceite e a ausência da skill `eumaeus-dev`. Seis frentes fizeram auditoria somente leitura; navegador, migrations, integração e commits ficaram com o coordenador.
- [x] Hipótese confirmada: chave de idempotência de pagamento reutilizada em outra fatura/valor agora é rejeitada; a UI gera uma chave por tentativa e preserva a mesma chave somente em retry da mesma tentativa. Regressão financeira: 8/8 aprovados no lote focal; build backend aprovado.

### WhatsApp inbound dedicado e concorrência HTTP — checkpoint 2026-10-12

- [x] A persistência provisória em `CommunicationOutbox` foi substituída por `WhatsAppInboundEvent`, com clínica/canal/provedor/evento externo, telefone, payload append-only, estado, tentativas, lease, ordenação, correlação e índices de deduplicação. A migration `z_20261012103000_whatsapp_inbound_events` preserva rows inbound históricos válidos e remove somente suas cópias do outbox de saída; dados sem `eventId` não são adivinhados nem removidos.
- [x] A rota WhatsApp agora grava no modelo inbound dedicado e o endpoint de dispatch de comunicação processa essa mesma fila lógica com claims condicionais, lease recuperável, retry/backoff limitado e estado fora de ordem sem regressão. Nenhum processamento envia mensagem real.
- [x] Contrato de processamento isolado: commit `115326f`, `4/4` testes aprovados para claim concorrente, retry, lease expirado, ordenação e correlação. Focal combinado WhatsApp/processador: `8/8`; build backend aprovado.
- [x] Migrations locais PostgreSQL aplicadas e status `26 migrations found / schema up to date`; banco Docker `eumaeus-postgres-local` foi o único alvo.
- [x] Harness HTTP autenticado real: commit `18663fd` mais ajuste do cenário de parcelas. Execução final `ok: true`: pagamentos/idempotência/autoria, duas parcelas iguais com chaves distintas, pacote, estoque, estorno concorrente e isolamento entre clínicas. O retry de conflito serializável reutiliza a mesma chave; não cria operação duplicada.
- [ ] Ainda parcial: não há conexão real com Meta nem entrega externa; o transporte permanece simulação/local. O histórico inbound está persistido e processável, mas correlação semântica com cada mensagem outbound depende do identificador fornecido pelo provedor.
- [ ] Validação visual por cliques das jornadas permanece separada dos testes HTTP/DB; não foi contada como concluída por estes scripts.

### Validação visual da build atual — checkpoint 2026-10-12

- [x] Build frontend atual (`VITE_API_URL` apontando somente para o backend local `3334`) carregou em `http://127.0.0.1:4174`; login da conta sintética `UI TESTE SINTETICO`/DONO funcionou e o dashboard mostrou clínica vazia sem fallback demonstrativo.
- [x] Por cliques, foram abertas e verificadas as telas Financeiro, Especialistas e Estoque. As telas exibiram formulários, estados vazios, permissões e mensagens de orientação; nenhuma mutação financeira/estoque/especialista foi executada sem confirmação específica.
- [x] O diagnóstico visual inicial em `4173`/`3333` foi separado: essas portas estavam servindo a worktree antiga. A build atual foi repetida em `4174`/`3334`; a inclusão explícita dessas origens locais no CORS foi corrigida e o login passou.
- [x] Frente frontend `7ab8d23`: build com `2674` módulos; suíte atual reportada pelo agente `11` arquivos / `84` testes aprovados, incluindo 2 testes focais de Financeiro e helpers Decimal. Essa contagem não soma os 81 testes históricos.
- [ ] Jornada visual completa de criação, atendimento, recebimento, pacote, comunicação, prontuário e assistência ainda requer fixtures e confirmações imediatamente antes das mutações; não foi classificada como ponta a ponta.

### Auditoria isolada da suíte frontend — 2026-10-12

- [x] Causa da execução anterior inconclusiva identificada: `package.json` define `test` como `vitest` sem `run`, portanto `npm test` sem argumentos entra em modo watch/interativo e não produz conclusão apropriada para automação.
- [x] Execução reproduzível: `vitest run --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=reports/private/frontend-18-one-worker.json`; resultado `10` arquivos / `81` testes aprovados, sem falhas ou pendências. O relatório está em diretório ignorado.
- [x] Revalidação pelo script oficial: `npm test -- --run --maxWorkers=1 --minWorkers=1 --reporter=json --outputFile=reports/private/frontend-npm-run-explicit-20261012.json`; resultado novamente `81/81`, exit `0`, sem processos Vitest residuais. Checksums dos relatórios: `438b626ba8a7742c73079c8df5292049fa1bb558fffcfbaddd7fec711b86b4bb` e `55788d72d4db25c322d32b1b951f3c22cdb237f1047f32ec0185f52644f39b85`.
- [x] O maior arquivo foi `src/api/__tests__/apiClient.test.ts` (~4,53 s); `Financeiro.test.tsx` levou ~0,76 s. Não há evidência de timer aberto ou travamento funcional nesta execução.
- [x] O commit `1eaf9c4` altera somente seis arquivos de `src/` (estoque, assistência, especialistas, operação e APIs); não adiciona testes. Nenhuma regressão foi reproduzida e nenhuma correção de produção foi necessária.
- [ ] O número “18 testes focais” reportado anteriormente não corresponde a uma suíte nomeada ou arquivo distinto no checkout integrado; a evidência verificável desta rodada é a suíte completa `81/81`, sem somar contagens não rastreáveis.
- [ ] Havia processos Jest de uma frente backend paralela durante a inspeção final; não foram alterados ou encerrados por esta auditoria, pois o escopo desta rodada excluía backend.
- [x] Hipótese confirmada: marcar fatura como paga sem recebimentos POSTED foi removido da UI e rejeitado no serviço; estorno recalcula o estado pela soma Decimal dos pagamentos restantes.
- [x] Hipótese confirmada: token assinado para usuário inexistente agora é recusado (`401 Acesso revogado`).
- [x] Autoria de prescrições/orçamentos assistenciais agora deriva do usuário autenticado; campos de autoria enviados pelo cliente são ignorados. Lote focal combinado: 23/23 testes aprovados; build backend aprovado.
- [x] Proxy tenant passou a incluir os nove modelos de internação/cirurgia e suas relações conhecidas. A proteção de relações cruzadas em criação aninhada ainda requer testes PostgreSQL e validações de serviço; não classificar como concluída apenas por essa inclusão.
- [x] Migration local preparada para substituir unicidade global de `StockMovement.idempotencyKey` e `CommunicationOutbox.dedupeKey` por unicidade composta por clínica; `prisma validate` aprovado. Ainda não aplicada: executar somente em PostgreSQL local isolado.
- [x] PostgreSQL Docker local validado sem conexão remota: a primeira tentativa falhou de forma reproduzível porque a instalação representava a unicidade antiga como constraint (`2BP01`); a migration foi corrigida e reaplicada, seguida de uma migration aditiva para instalações onde a outbox usa índice legado.
- [x] A discrepância foi esclarecida: há `24` diretórios de migration, `24` registros com `finished_at` e `1` registro adicional da primeira tentativa falha, marcada `rolled_back_at`; portanto `25` linhas em `_prisma_migrations` não significam 25 migrations distintas. A aplicação final está íntegra.
- [x] Backup custom-format local e restauração em `eumaeus_restore_test` preservaram `25` registros históricos de migration (`24` concluídos + `1` rollback), `46/46` tabelas e índices compostos. Contagens representativas coincidiram: `User 9`, `Product 3`, `StockMovement 6`, `CommunicationOutbox 10`, `Payment 4`, `TenantDataReview 6`.
- [ ] Pendente: exercitar concorrência real com novos dados sintéticos isolados e validar relações cruzadas em PostgreSQL; os registros ambíguos existentes (produtos sem clínica) não foram usados nem atribuídos silenciosamente.
- [ ] Pendente: endurecer verificação de papel revogado em tokens já emitidos; a hipótese de papel stale foi confirmada por inspeção e ainda não tem regressão executada.
- [x] Verificação de papel revogado concluída: `requireRoles` consulta `active`, `roleName` e `clinicId` atuais do usuário antes de liberar a rota. Regressão adicionada para token DONO emitido antes da troca para RECEPCAO: `9/9` testes de autenticação aprovados; build backend aprovado.
- [ ] Pendente: corrigir validações explícitas de relações em operações aninhadas (`connect`, `disconnect`, `upsert`, `updateMany`) e cobrir leitura/escrita HTTP cruzada.
- [x] Proxy endurecido contra sobrescrita explícita de `clinicId`: updates recebem o contexto autenticado e valores divergentes são rejeitados; relações `connect`/`disconnect` continuam bloqueadas no proxy para exigir validação de serviço.
- [x] Regressão do proxy adicionada: derivação de `clinicId`, rejeição de associação relacional aninhada e rejeição de `clinicId` divergente; `27/27` testes focais e build backend aprovados.
- [ ] Pendente: validação HTTP/PG de associação por chaves estrangeiras e operações em lote; a cobertura atual prova o guard do proxy, não a jornada HTTP completa.
### Jornada visual operacional e catálogo — checkpoint 2026-10-13

**Ambiente/evidência:** PostgreSQL Docker local `eumaeus-postgres-local` (`eumaeus_local`), backend da worktree em `:3334`, frontend em `:4174`, usuário sintético da clínica `99001`. Nenhum banco remoto, Hermes ou transporte externo foi usado.

- Corrigido o defeito de persistência em que `NODE_ENV=test` ativava um armazenamento em memória de tutores, enquanto pets usavam PostgreSQL. O fallback agora só é habilitado por `USE_IN_MEMORY_TUTOR_STORE=true`; o fluxo integrado local permanece no banco. Evidência visual: tutor criado pela tela, recarregado e encontrado como id 54; pet Luna QA Persistente criado pela tela e reapareceu após reload.
- Implementado o primeiro caminho visual de catálogo em Configurações → Serviços: nome, categoria, preço, duração e descrição; leitura e criação usam o catálogo persistido da clínica. Serviço sintético `Banho QA Jornada`, categoria `BANHO_TOSA`, R$ 45,90, 50 min, foi criado por clique e reapareceu na tela.
- Corrigida a projeção do serviço associado no retorno de agendamentos. Antes a agenda mostrava `undefined - Pet ID`; agora mostra `Banho QA Jornada - Pet ID: 48`. Regressão focal: `backend/src/__tests__/appointment.service.projection.test.ts` (1/1).
- Jornada visual comprovada após reload em cada transição: criação do agendamento → `CONFIRMED` → `ARRIVED` → `IN_PROGRESS` → `READY` → `COMPLETED`. A agenda mostrou o serviço, o pet e o status persistidos. As transições geram/cancelam comunicação transacional pelo backend; histórico de comunicação ainda precisa de validação visual dedicada.

**Estado da matriz neste checkpoint:** cadastro tutor/pet, catálogo e agenda operacional estão implementados e validados pela interface no ambiente sintético. Pacote, cobertura de cobrança, adicional, desconto, recebimento e histórico de avisos ainda não estão validados visualmente nesta sessão; não foram marcados como concluídos. Financeiro e ações clínicas permanecem sujeitos às confirmações específicas aplicáveis.

**Verificações:** `npm run build` frontend passou (2674 módulos); `npm run build` backend passou; teste focal de projeção passou (1 suíte/1 teste). A suíte antiga `appointment.status.integration.test.ts` continua com 3 falhas 401 por fixture de autenticação incompatível com a validação atual de usuário; isso é resultado inconclusivo/preexistente para os três cenários, não evidência de aprovação.

### Telas administrativas — diagnóstico visual 2026-10-13

- Financeiro: a tela agora expõe criação de centro de resultado com proteção DONO/FINANCEIRO, além do formulário já existente de despesa. Na clínica sintética `99001`, a lista iniciou vazia; nenhuma despesa foi submetida neste checkpoint. Próxima ação preparada, aguardando confirmação imediatamente anterior: criar o centro `BANHO_TOSA`, nome `Banho e tosa — QA local`, somente no banco local; efeito esperado é o centro aparecer após reload e ficar selecionável na despesa.
- Estoque: a tela expõe entrada por lote, ajuste/perda/devolução, justificativa e prevenção de duplicação no backend, mas a clínica `99001` ainda não possui produto sintético. A jornada de lote/ajuste permanece parcial até um produto ser criado pela interface.
- Especialistas: a tela expõe cadastro e disponibilidade, porém requer `ID do usuário autorizado`; a clínica sintética tem apenas o usuário DONO da sessão e não há especialista informado. A associação/confirmação na agenda permanece não validada visualmente; não será inventada especialidade, habilitação ou usuário.
- O smoke test dessas páginas não foi contado como jornada concluída. O trabalho visual comprovado nesta série continua restrito a tutor, pet, catálogo e agenda com todas as transições operacionais.
- Comunicação: a tela Operação agora expõe Básico, somente pet pronto, acompanhamento, saúde, campanhas, pausa de 24h e parada total. Para o tutor sintético id 54, as cinco categorias foram gravadas por clique; após reload o histórico mostrou `APPOINTMENT_CREATED`, `APPOINTMENT_ARRIVED`, `APPOINTMENT_STARTED`, `PET_READY` e `APPOINTMENT_COMPLETED`, com os avisos antigos cancelados e o último ainda `QUEUED`. A pausa e a parada total foram acionadas em seguida. Isso comprova interface, persistência e cancelamento em modo simulação, mas não entrega externa.
- 401 corrigidos nas fixtures de `appointment.status.integration.test.ts`: o contrato atual exige revalidação de usuário ativo/papel, então a fixture passou a mockar `prisma.user.findFirst` como DONO ativo. Resultado isolado: 3/3 aprovados, incluindo status inválido sem escrita; nenhuma permissão foi afrouxada.
- QA de estoque: produto id 36 criado pela interface; entrada correta no lote id 34 (`QA-LOTE-20261013-CORRETO`, 10 unidades, validade `2027-12-31`), ajuste id 36 de 2 unidades e histórico visual após reload. Um lote anterior id 33 persistiu com validade incorreta (`0027-02-20`) devido ao campo nativo de data; ele não foi removido. O formulário foi corrigido para texto explícito `YYYY-MM-DD` e a jornada correta foi repetida. Isso é evidência de defeito encontrado/corrigido, não de limpeza de dados.
- Especialista: fixture local de credencial protegida foi criada sem exibir senha: usuário VETERINARIO id 55, clínica 99001. O perfil especialista id 2 foi cadastrado pela tela com especialidade explicitamente sintética, repasse 0 e disponibilidade 1: 08:00–17:00. A associação e confirmação na agenda do atendimento 112 foram feitas por clique; consulta local confirmou assignment id 3, clínica 99001, specialist id 2, status `CONFIRMED`. O cadastro do usuário foi preparação de fixture, não validação visual de criação de conta.
- Pacotes: a tela Operação agora permite cadastrar pacote, preço, sessões, validade, descrição e serviço de catálogo coberto. O formulário carrega `Banho QA Jornada`; criação do pacote/contrato e consumo permanecem preparados, mas a submissão do preço contratado aguarda confirmação específica.
- Regressões focais adicionais: `package.service.test.ts` 5/5 e `financial.service.test.ts` 8/8 passaram em execução isolada (13/13). Cobrem cobertura do pacote, concorrência de saldo, estorno auditável, autoria autenticada, idempotência, rollback de auditoria e múltiplos pagamentos.

### Pacote criado pela interface — checkpoint 2026-10-13

- [x] Em sessão local sintética DONO da clínica `99001`, a ausência de duplicata foi conferida antes da ação. O formulário foi preenchido visualmente com `Pacote QA Banho 3 sessões`, preço `120.00`, serviço `Banho QA Jornada · BANHO_TOSA`, 3 sessões, validade 30 dias e descrição sintética.
- [x] A confirmação recebida cobria somente o botão `Criar pacote`; ele foi clicado uma única vez. A UI exibiu `Pacote persistido e vinculado ao serviço coberto`.
- [x] Consulta PostgreSQL local confirmou exatamente um registro correspondente: `ServicePackage id=22`, `clinicId=99001`, `price=120.00`, `totalSessions=3`, `validityDays=30`, `coveredCatalogServiceId=24`. Após reload, o cartão do pacote reapareceu.
- [ ] Contratação, consumo, cobertura na fatura, adicional, desconto, recebimento e estorno não foram executados com essa confirmação; são mutações distintas e permanecem preparadas para confirmação própria. Nenhuma chamada de API foi usada para substituir esses cliques.
- [x] A sessão anterior do navegador havia expirado ao abrir nova aba. Foi criada apenas uma conta DONO sintética nova no PostgreSQL Docker local, com senha temporária gerada e descartada sem registro; a conta existente e os dados anteriores permaneceram intactos.

### Atualização da missão — financeiro, receitas e assistente — checkpoint 2026-10-13

- [x] Implementada a preparação contábil determinística em `POST /api/financial/accounting/prepare`, restrita a DONO/FINANCEIRO e ao `clinicId` autenticado. O relatório separa faturamento, recebimentos POSTED, estornos, pendentes, descontos e despesas, preserva valores como Decimal formatado, lista centros selecionados e explicita despesas sem classificação e faturas sem documento fiscal. A geração grava `ACCOUNTING_EXPORT_GENERATED` com ator e período.
- [x] A tela Financeiro agora oferece período, seleção de centros, prévia conciliável, download CSV e impressão do resumo. Não emite XML/NFS-e, não presume contador e não envia dados; compartilhamento externo permanece não implementado até destinatário e autorização explícitos.
- [x] Teste de regressão `financial.service.test.ts`: 9/9 aprovados, incluindo o relatório isolado por clínica, totais, pendências e auditoria. Builds frontend (2674 módulos) e backend aprovados.
- [ ] A prévia/exportação ainda não foi validada por cliques nesta rodada; estado correto: implementação + teste automatizado, validação visual pendente.
- [ ] Receita digital permanece parcialmente implementada: rascunho/revisão/aprovação/PDF/impressão existentes precisam ser revalidados pela interface e a integração de compartilhamento deve usar somente a versão aprovada. Assinatura verificável, receitas controladas e requisitos regulatórios dependem de provedor/certificado e não serão simulados como conformidade.
- [ ] Assistente administrativo ainda é backlog executável: falta painel determinístico com origem, prazo, responsável, link, concluir/adiar/dispensar e histórico idempotente. Nenhum LLM ou chamada paga foi adicionada.
- [x] Validação visual da exportação contábil: sessão DONO sintética, período `2026-10-01` a `2026-10-13`, clínica `99001`, centro `BANHO_TOSA`; a prévia exibiu geração local, totais zerados coerentes com a ausência de faturas/despesas e zero pendências. O botão de download CSV foi acionado e a impressão foi acionada sem envio externo.
- [ ] O controle de navegador não disponibilizou o arquivo baixado nem um diálogo de impressão/PDF inspecionável; portanto cabeçalho, acentuação, fórmulas em células e paginação do artefato final permanecem validação parcial. A implementação CSV deve ser endurecida/testada com dados contendo prefixos de fórmula antes de aceite final.
- [x] Proteção CSV adicionada em `src/lib/csv.ts`: valores que começam por `=`, `+`, `-` ou `@` recebem prefixo textual antes de serem citados. Regressão Vitest `src/lib/__tests__/csv.test.ts`: 1/1 aprovado, cobrindo fórmula, acentuação e delimitador.
- [x] Build frontend reconstruído com `VITE_API_URL=http://127.0.0.1:3334`: 2675 módulos transformados, concluído em 31,41s. O smoke test visual foi repetido contra o backend correto.
- [x] Inicialização local documentada/automatizada em `scripts/start-local-office.sh`: recusa `DATABASE_URL` fora do PostgreSQL Docker local, compila backend, incorpora `VITE_API_URL` na build e inicia a API em `3334`; o frontend deve ser servido em `4174`. Não é configuração de produção.
- [x] Auditoria de receitas corrigiu isolamento em transações: criação, leitura, atualização, revisão, cancelamento, versões e listagem agora exigem contexto de clínica e filtram `clinicId`; itens e snapshots usam a mesma clínica. RED/GREEN em `prescription.service.test.ts`: primeiro 3/4 passaram e o novo teste falhou pela ausência de filtro; após a correção 4/4 passaram. Build backend aprovado.
- [ ] Delegação: os três despachos anteriores retornaram somente `clientThreadId`; `list_threads` não apresentou threads executáveis, responsáveis ou status. Não há processo acompanhável. Nenhum novo despacho foi criado; o coordenador assumiu as frentes de segurança e inicialização, e as frentes restantes continuam pendentes.
- [x] Assistente administrativo determinístico inicial implementado: `GET /api/dashboard/assistant` reúne agenda do dia, recebíveis pendentes, estoque baixo, lotes próximos do vencimento, pacotes com pouca validade/saldo, tarefas atrasadas e falhas da outbox. Cada alerta contém `source`, motivo, prazo quando existente e rota de origem; a consulta usa o contexto autenticado da clínica.
- [x] Dashboard passou a exibir os alertas reais e links para as telas correspondentes, sem LLM nem ações autônomas. Teste backend `assistant.service.test.ts`: 1/1 aprovado; builds backend e frontend aprovados.
- [ ] Assistente ainda parcial: concluir/adiar/dispensar com histórico persistente e deduplicação durável exigem modelo/migration coordenados; não foram simulados com estado volátil.
- [x] Diagnóstico do primeiro smoke test visual corrigido: a build estava apontando para `3333` (worktree antiga) enquanto o backend da worktree atual rodava em `3334`. A reconstrução explícita com `VITE_API_URL=http://127.0.0.1:3334`, novo login sintético e reload carregaram a tela Financeiro e a nova prévia sem alterar registros financeiros.
