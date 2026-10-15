# Matriz de auditoria integrada — Escritório Dev

Checkpoint: `f98fde93dba769600d1b304497ca7fa4e274514c`
Branch: `codex/eumaeus-dev-office-20261012`
Ambiente: PostgreSQL Docker local e dados sintéticos somente.

## Estado real

| Módulo | Banco | Backend/API | Frontend | Automação | Integração/UI/reload | Segurança | Pendência objetiva |
|---|---|---|---|---|---|---|---|
| Pacotes/contratos | Implementado | Implementado, consumo idempotente e estorno justificado | `/operacao` parcial, ainda orientada a IDs | Testes de serviço e concorrência | API validada; jornada comercial completa ainda não | Cobertura de clínica, pet e saldo negativo | Conectar seleção por nome, agenda, atendimento e cobrança sem dupla receita |
| Agenda/atendimentos | Implementado | CRUD, status e especialista | `/agendamentos` disponível | Testes de domínio existentes | Parte validada visualmente em checkpoints anteriores | Conflitos e tenant cobertos parcialmente | Completar jornada pacote→sessão→cobrança |
| Receitas/prontuário | Implementado | Versionamento, revisão, PDF e escopos | `/prontuario` e impressão | Testes de prescrição/PDF | API e impressão sintética validadas; fluxo clínico por clique parcial | Papéis e clínica cobertos | Validar telas completas sem inventar decisão clínica |
| Internação | Implementado | Admissão, tarefas, prescrição, passagem e alta protegidas | `/assistencia` disponível | Testes de cuidado e negativas | Controles visuais existem; mutações clínicas exigem confirmação específica | Papéis/tenant cobertos | Completar histórico/reload administrativo e evidência de cada transição |
| Cirurgia | Implementado | Caso, orçamento, consentimento, checklist e orientações protegidos | `/assistencia` parcial | Testes de cuidado existentes | Ainda não há jornada visual completa | Papéis e clínica cobertos | Validar estados administrativos sem fabricar consentimento ou execução |
| Especialistas | Implementado | Perfil, disponibilidade e assignment | `/especialistas` disponível | Testes de associação/conflito | Consulta visual validada; integração de agenda parcial | Papéis/tenant cobertos | Integrar seleção e confirmação na agenda |
| Estoque/medicamentos | Implementado | Lotes, movimentos, perdas, devoluções e idempotência | `/estoque` disponível | Testes de invariantes | UI inicial validada; consumo clínico parcial | Papel DONO e tenant cobertos | Completar operações visuais e vínculo autorizado ao atendimento |
| Financeiro/contabilidade | Implementado | Decimal, períodos, centros, recebimentos, estornos e auditoria | `/financeiro` disponível | 166/166 backend; direcionado frontend 22/22 | Prévia/CSV/PDF e lembretes validados; share simulado coberto por teste | RBAC, tenant e negativos cobertos | Limitação legada: não há histórico temporal de mudança de centro |
| Lembretes/comunicação | Implementado | Preferências, outbox, reminders e dispatcher simulado | `/operacao` e dashboard | Testes de deduplicação/retry/reativação | Justificativa inline e reload visual validados | Preferências e clínica cobertas | Nenhum transporte externo; manter simulação |
| Permissões/isolamento | Implementado | Middleware por requisição e proxy Prisma | Estados de permissão nas telas principais | Testes negativos de autenticação/tenant | Evidência HTTP e visual separadas | Cobertura forte, ampliar por jornada | Repetir somente nos fluxos novos |

## Prioridade executável

1. Implementar e validar a jornada visual completa de pacote (tutor → pet → pacote → contrato → atendimento → consumo → saldo), substituindo IDs manuais por seleções carregadas quando as APIs existentes permitirem.
2. Completar pacotes pela UI com seleção de tutor/pet/serviço, contrato, sessão e cobrança; manter confirmação para mutações financeiras.
3. Completar matriz administrativa de internação e cirurgia com dados sintéticos já existentes, sem registrar novos fatos clínicos não autorizados.
4. Validar receitas/prontuário por interface e reload, distinguindo escrita clínica autorizada de leitura/ impressão.
5. Executar cenário integrado de duas clínicas e atualizar esta matriz com evidência unitária, integração, API, banco, navegador e limitações.

## Diagnóstico frontend atual

A suíte direcionada do checkpoint permanece versionada em `frontend-office-targeted-final.json`. A causa das falhas de coleta/seletores múltiplos era ausência de `cleanup()` global do Testing Library entre testes. Após corrigir `src/setupTests.ts`, as áreas focalizadas passaram 37/37 e a suíte completa passou 44 suítes/90 testes. O relatório JSON versionado está em `frontend-integrated-fixed.json`; nenhuma expectativa foi alterada.

## Limites

Não houve produção, banco remoto, Hermes, mensagem real, emissão fiscal, gasto, assinatura ou decisão clínica automática. Dados ambíguos e limitações históricas permanecem documentados; não foram preenchidos por suposição.
