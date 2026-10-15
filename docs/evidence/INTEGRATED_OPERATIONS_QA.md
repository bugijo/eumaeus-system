# Matriz de auditoria integrada — Escritório Dev

Checkpoint: `6fe41eb`
Branch: `codex/eumaeus-dev-office-20261012`
Ambiente: PostgreSQL Docker local e dados sintéticos somente.

## Estado real

| Módulo | Banco | Backend/API | Frontend | Automação | Integração/UI/reload | Segurança | Pendência objetiva |
|---|---|---|---|---|---|---|---|
| Pacotes/contratos | Comprovado ponta a ponta | Contrato, vínculo tutor/pet/atendimento, consumo idempotente e estorno justificado | `/operacao` validada visualmente com seleção e reload | backend 167/167; frontend 46/46 suítes, 92/92; integração 7/7 | Contrato 24: 3/3→2/3→reload→estorno→3/3; sessão histórica visível | Clínica/pet protegidos; sessão sem InvoiceItem | Cobrança financeira permanece sem mutação não confirmada |
| Agenda/atendimentos | Implementado | CRUD, status e especialista | `/agendamentos` disponível | Testes de domínio existentes | Parte validada visualmente em checkpoints anteriores | Conflitos e tenant cobertos parcialmente | Completar jornada pacote→sessão→cobrança |
| Receitas/prontuário | Implementado | Versionamento, revisão, PDF e escopos | `/prontuario` e impressão | Testes de prescrição/PDF | API e impressão sintética validadas; fluxo clínico por clique parcial | Papéis e clínica cobertos | Validar telas completas sem inventar decisão clínica |
| Internação | Implementado | Admissão, tarefas, prescrição, passagem e alta protegidas | `/assistencia` disponível | Regressão administrativa 22/22; negativas de cuidado cobertas | Controles visuais existem; mutações clínicas exigem confirmação específica | Papéis/tenant cobertos | Completar histórico/reload administrativo e evidência visual de cada transição |
| Cirurgia | Implementado | Caso, orçamento, consentimento, checklist e orientações protegidos | `/assistencia` parcial | Regressão de cuidado 22/22; orçamento/versionamento cobertos | Ainda não há jornada visual completa | Papéis e clínica cobertos | Validar estados administrativos sem fabricar consentimento ou execução |
| Especialistas | Implementado | Perfil, disponibilidade e assignment | `/especialistas` disponível | Testes de associação/conflito | Consulta visual validada; integração de agenda parcial | Papéis/tenant cobertos | Integrar seleção e confirmação na agenda |
| Estoque/medicamentos | Implementado | Lotes, movimentos, perdas, devoluções e idempotência | `/estoque` disponível | Testes de invariantes | UI inicial validada; consumo clínico parcial | Papel DONO e tenant cobertos | Completar operações visuais e vínculo autorizado ao atendimento |
| Financeiro/contabilidade | Implementado | Decimal, períodos, centros, recebimentos, estornos e auditoria | `/financeiro` disponível | 166/166 backend; direcionado frontend 22/22 | Prévia/CSV/PDF e lembretes validados; share simulado coberto por teste | RBAC, tenant e negativos cobertos | Limitação legada: não há histórico temporal de mudança de centro |
| Lembretes/comunicação | Implementado | Preferências, outbox, reminders e dispatcher simulado | `/operacao` e dashboard | Testes de deduplicação/retry/reativação | Justificativa inline e reload visual validados | Preferências e clínica cobertas | Nenhum transporte externo; manter simulação |
| Permissões/isolamento | Implementado | Middleware por requisição e proxy Prisma | Estados de permissão nas telas principais | Testes negativos de autenticação/tenant | Evidência HTTP e visual separadas | Cobertura forte, ampliar por jornada | Repetir somente nos fluxos novos |

## Prioridade executável

1. Avançar para a integração administrativa visual de internação e cirurgia, sem criar fatos clínicos.
2. Integrar especialistas e conflitos de agenda, preservando tenant e confirmações específicas.
3. Completar matriz administrativa de internação e cirurgia com dados sintéticos já existentes, sem registrar novos fatos clínicos não autorizados.
4. Validar receitas/prontuário por interface e reload, distinguindo escrita clínica autorizada de leitura/ impressão.
5. Executar cenário integrado de duas clínicas e atualizar esta matriz com evidência unitária, integração, API, banco, navegador e limitações.

## Diagnóstico frontend atual

A suíte direcionada do checkpoint permanece versionada em `frontend-office-targeted-final.json`. A causa das falhas de coleta/seletores múltiplos era ausência de `cleanup()` global do Testing Library entre testes. Após corrigir `src/setupTests.ts`, as áreas focalizadas passaram 37/37 e a suíte completa passou 44 suítes/90 testes. O relatório JSON versionado está em `frontend-integrated-fixed.json`; nenhuma expectativa foi alterada.

Após a melhoria da jornada de pacotes, o teste focal `src/pages/__tests__/OperacaoPage.test.tsx` passou 2/2 e a suíte completa passou 46 suítes/92 testes. O relatório está em `frontend-packages.json`. O teste cobre a seleção visual de tutor/pet/pacote e a oferta de atendimento/serviço vinculados; não simula cobrança nem comunicação externa.

No backend, `src/__tests__/package.service.test.ts` passou 5/5 contra o PostgreSQL sintético local. A evidência versionada está em `backend-packages.json` e cobre consumo do serviço coberto, rejeição de serviço incompatível, decremento concorrente, bloqueio de estorno faturado e restauração do saldo com justificativa.

As regressões administrativas `care.service`, `assistant.service`, `prescription.service`, `communication.service` e `assistant.reminder.service` passaram 22/22. O relatório está em `backend-admin-continuation.json`; não houve escrita clínica nova nem decisão de consentimento.

## Prova ponta a ponta de pacotes — 2026-10-15

- Ambiente: backend local `127.0.0.1:3334`, frontend local `127.0.0.1:4174`, PostgreSQL Docker `eumaeus-postgres-local` em `127.0.0.1:55432/eumaeus_local`, identidade QA da clínica `99001`.
- Interface: login visual, tutor `54`, pet `48`, pacote `22`, contrato `24`, preço `R$ 120,00`, 3 sessões e vencimento `14/11/2026`; atendimento `112` e serviço `41` selecionados visualmente; consumo mostrou `Saldo: 2/3`; reload recuperou 2/3; estorno com justificativa mostrou 3/3; novo reload preservou a sessão estornada.
- PostgreSQL: contrato `24` com `remainingSessions=3`; sessão `24` vinculada a contrato/atendimento/serviço `24/112/41`, tutor/pet `54/48`, justificativa `QA visual local: correção controlada`; `InvoiceItem` da sessão: `0`.
- Defeito confirmado: `AppointmentService.getAllAppointments` descartava `id` e `catalogServiceId` dos serviços, deixando o seletor visual vazio. A projeção foi corrigida e coberta por regressão; antes da correção a reprodução visual e o teste falharam.
- Relatórios: `backend-package-integration-fixed.json` (7/7 integração focal) e `frontend-package-final.json` (46 suítes/92 testes). O script local também registrou consumo e estorno sintéticos sem fatura ou pagamento.
- Acesso entre pets: regressão negativa confirmou que contrato do pet A não consome atendimento do pet B mesmo com o mesmo serviço; saldo e sessão permanecem inalterados.

## Limites

Não houve produção, banco remoto, Hermes, mensagem real, emissão fiscal, gasto, assinatura ou decisão clínica automática. Dados ambíguos e limitações históricas permanecem documentados; não foram preenchidos por suposição.
