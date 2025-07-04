# PulseVet System - Roadmap de Desenvolvimento

## Legenda de Status
- ✅ **Concluído:** Tarefa finalizada e validada.
- ⏳ **Em Andamento:** Tarefa que estamos executando agora.
- 🔲 **A Fazer:** Próximas tarefas na fila.
- 🚀 **Visão Futura:** Ideias para evoluções pós-V2.0.

---

## FASE 1: FUNDAÇÃO E ESTRUTURA (O que já fizemos)

Esta fase representa a base sólida que construímos para o projeto.

- ✅ **1.1. Setup do Projeto e Banco de Dados:**
  - [x] Configuração do monorepo (Frontend + Backend).
  - [x] Instalação e configuração do Prisma com PostgreSQL.
  - [x] Modelagem inicial de dados (Tutor, Pet, Appointment, etc.).
- ✅ **1.2. Segurança e Estabilidade:**
  - [x] Implementação do fluxo de autenticação com JWT e Refresh Tokens.
  - [x] Criação de `ProtectedRoute` no frontend.
  - [x] Implementação de `Error Boundaries` para resiliência da UI.
- ✅ **1.3. UI e Infraestrutura Frontend:**
  - [x] Configuração do Vite, TailwindCSS e `shadcn/ui`.
  - [x] Implementação de `QueryClientProvider` para React Query.
  - [x] Criação do `apiClient` com interceptors Axios.
  - [x] Criação da página de Login e do Layout principal.
- ✅ **1.4. CRUD de Tutores (Completo):**
  - [x] **Read:** Tela de listagem de tutores com React Query.
  - [x] **Create:** Formulário de criação de tutor com React Hook Form e Zod.
  - [x] **Update:** Funcionalidade de edição com formulário inteligente.
  - [x] **Delete:** Exclusão segura com modal de confirmação AlertDialog.

---

## FASE 2: VERSÃO 1.0 (MVP PARA LANÇAMENTO)

Esta é a nossa lista de missões para ter uma versão funcional e lançável do sistema.

- ✅ **2.1. Finalizar CRUD de Tutores:**
  - ✅ **Update:** Criar a funcionalidade e a interface para editar um tutor existente.
  - ✅ **Delete:** Implementar a funcionalidade de exclusão com modal de confirmação.

- ⏳ **2.2. Implementar CRUD Completo de Pets:**
  - 🔲 Create, Read, Update e Delete para Pets, com vínculo obrigatório ao Tutor.

- 🔲 **2.3. Implementar Gestão de Agendamentos (Core):**
  - 🔲 CRUD completo para Agendamentos.
  - 🔲 Interface de calendário para visualização e criação de novos agendamentos.

- 🔲 **2.4. Implementar Prontuário Eletrônico (Core):**
  - 🔲 Capacidade de criar um registro de consulta a partir de um agendamento.
  - 🔲 Visualização do histórico médico completo na página de detalhes do Pet.

- 🔲 **2.5. Implementar Gestão de Estoque (Core):**
  - 🔲 CRUD completo de Produtos (medicamentos e materiais).
  - 🔲 Funcionalidade para dar baixa em itens do estoque durante um atendimento.

- 🔲 **2.6. Deploy de Produção (Lançamento V1.0):**
  - 🔲 Preparar e fazer o deploy do Backend no Render (com PostgreSQL).
  - 🔲 Preparar e fazer o deploy do Frontend na Vercel.
  - 🔲 Configurar o CI/CD básico no GitHub Actions.

---

## FASE 3: VERSÃO 2.0 (EVOLUÇÃO PÓS-LANÇAMENTO)

Após o lançamento da V1.0, estas serão nossas prioridades para agregar mais valor.

- 🔲 **3.1. Refatoração para Arquitetura Multi-Tenant (SaaS):**
  - 🔲 Criar modelo `Clinic` no `schema.prisma`.
  - 🔲 Adicionar `clinicId` às tabelas principais (User, Tutor, Pet, etc.) e executar migração.
  - 🔲 Refatorar todas as queries do backend para filtrar por `clinicId` em cada requisição.
  - 🔲 Implementar painel "Super Admin" para gerenciamento de clínicas.
  - 🔲 Adaptar o fluxo de autenticação para o contexto multi-tenant.

- 🔲 **3.2. Implementar Módulo Financeiro:**
  - 🔲 Geração de faturamento a partir dos atendimentos.
  - 🔲 Controle de pagamentos e fluxo de caixa.

- 🔲 **3.3. Implementar Portal do Cliente:**
  - 🔲 Criação do site público (Headless CMS).
  - 🔲 Área de login para tutores.
  - 🔲 Agendamento online.

- 🔲 **3.4. Implementar Relatórios e Dashboard Avançado:**
  - 🔲 Gráficos e métricas interativas no dashboard.
  - 🔲 Módulo dedicado para relatórios gerenciais.

- 🔲 **3.5. Notificações e Automações:**
  - 🔲 Integração para enviar lembretes de consulta (E-mail/WhatsApp).

- 🔲 **3.6. Refinamento Técnico:**
  - 🔲 Otimizações de performance (Lazy Loading, Virtualização).
  - 🔲 Aumentar a cobertura e estabilidade dos testes automatizados.

---

## 🚀 FASE 4: VISÃO FUTURA (PULSE AI)

- 🚀 **4.1. Co-piloto de Gestão:** IA para análise de dados e sugestões de negócio.
- 🚀 **4.2. Co-piloto Clínico:** IA para suporte a diagnóstico e análise de prontuários.

Este novo tarefas.md é o nosso mapa estratégico. Ele mostra o quão longe já chegamos e o caminho claro que temos pela frente.

Agora, vamos voltar ao nosso "zoom tático". A primeira tarefa não concluída (🔲) na nossa lista da V1.0 é "Finalizar CRUD de Tutores".