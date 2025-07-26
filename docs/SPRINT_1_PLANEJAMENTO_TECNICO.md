# Sprint 1: Fundação do Portal do Cliente - Planejamento Técnico

## Objetivo do Sprint
Implementar a arquitetura de autenticação dual e criar a base técnica para o Portal do Cliente, permitindo que tutores façam login e acessem seus dados básicos.

## Duração Estimada
**2-3 semanas** (dependendo da complexidade dos testes)

## Épico Principal
**Portal do Cliente V2.0** - Fundação e Autenticação Dual

---

## 📋 Backlog do Sprint

### 🔧 1. Arquitetura e Banco de Dados

#### 1.1 Migração do Schema Prisma
- **Tarefa**: Implementar modelo `AuthProfile`
- **Status**: ✅ **CONCLUÍDO**
- **Arquivos**: `schema.prisma`
- **Estimativa**: 2h

#### 1.2 Migration do Banco de Dados
- **Tarefa**: Executar migration e script de migração de dados
- **Status**: 🔄 **PENDENTE**
- **Comandos**:
  ```bash
  npx prisma migrate dev --name add-auth-profile
  # Executar migration-script.sql
  npx prisma generate
  ```
- **Estimativa**: 4h
- **Riscos**: Perda de dados existentes
- **Mitigação**: Backup completo antes da migração

#### 1.3 Atualização dos Types TypeScript
- **Tarefa**: Regenerar tipos Prisma e atualizar interfaces
- **Status**: 🔄 **PENDENTE**
- **Arquivos**: `types/index.ts`, `types/auth.ts`
- **Estimativa**: 2h

### 🔐 2. Refatoração do Sistema de Autenticação

#### 2.1 AuthService Unificado
- **Tarefa**: Criar novo `AuthService` que suporte ambos os tipos
- **Status**: 🔄 **PENDENTE**
- **Arquivos**: `services/authService.ts`
- **Funcionalidades**:
  - Login universal (User + Tutor)
  - Geração de JWT contextual
  - Refresh token para ambos os tipos
- **Estimativa**: 8h

#### 2.2 Middleware de Autorização
- **Tarefa**: Atualizar middleware para suportar tipos múltiplos
- **Status**: 🔄 **PENDENTE**
- **Arquivos**: `middleware/auth.ts`
- **Funcionalidades**:
  - Detecção automática do tipo de usuário
  - Proteção de rotas por tipo
  - Validação de permissões contextuais
- **Estimativa**: 6h

#### 2.3 Atualização das APIs de Auth
- **Tarefa**: Refatorar endpoints de autenticação
- **Status**: 🔄 **PENDENTE**
- **Endpoints**:
  - `POST /api/auth/login` (universal)
  - `POST /api/auth/refresh` (universal)
  - `POST /api/auth/logout` (universal)
  - `POST /api/auth/register-tutor` (novo)
- **Estimativa**: 10h

### 🎨 3. Interface do Portal do Cliente

#### 3.1 Estrutura Base do Portal
- **Tarefa**: Criar estrutura de pastas e componentes base
- **Status**: 🔄 **PENDENTE**
- **Estrutura**:
  ```
  src/
  ├── portal/
  │   ├── components/
  │   │   ├── Layout/
  │   │   ├── Navigation/
  │   │   └── Dashboard/
  │   ├── pages/
  │   │   ├── Login/
  │   │   ├── Dashboard/
  │   │   └── Profile/
  │   └── hooks/
  │       └── usePortalAuth.ts
  ```
- **Estimativa**: 4h

#### 3.2 Tela de Login do Portal
- **Tarefa**: Criar interface de login específica para tutores
- **Status**: 🔄 **PENDENTE**
- **Componentes**:
  - `PortalLoginForm`
  - `PortalLayout`
  - Validação de formulário
  - Tratamento de erros
- **Estimativa**: 8h

#### 3.3 Dashboard Básico do Tutor
- **Tarefa**: Criar dashboard inicial com informações básicas
- **Status**: 🔄 **PENDENTE**
- **Funcionalidades**:
  - Dados pessoais do tutor
  - Lista de pets
  - Próximos agendamentos
  - Navegação básica
- **Estimativa**: 12h

### 🔗 4. APIs do Portal

#### 4.1 API de Dados do Tutor
- **Tarefa**: Criar endpoints específicos para o portal
- **Status**: 🔄 **PENDENTE**
- **Endpoints**:
  - `GET /api/portal/profile` - Dados do tutor logado
  - `GET /api/portal/pets` - Pets do tutor
  - `GET /api/portal/appointments` - Agendamentos do tutor
  - `PUT /api/portal/profile` - Atualizar dados pessoais
- **Estimativa**: 10h

#### 4.2 Middleware de Segurança do Portal
- **Tarefa**: Garantir que tutores só acessem seus próprios dados
- **Status**: 🔄 **PENDENTE**
- **Funcionalidades**:
  - Validação de ownership
  - Rate limiting específico
  - Logs de auditoria
- **Estimativa**: 6h

### 🧪 5. Testes e Validação

#### 5.1 Testes de Integração da Autenticação
- **Tarefa**: Criar testes para o novo sistema de auth
- **Status**: 🔄 **PENDENTE**
- **Cenários**:
  - Login de User (funcionário)
  - Login de Tutor (cliente)
  - Refresh token para ambos
  - Acesso negado entre tipos
- **Estimativa**: 8h

#### 5.2 Testes E2E do Portal
- **Tarefa**: Testes automatizados do fluxo completo
- **Status**: 🔄 **PENDENTE**
- **Cenários**:
  - Login no portal
  - Navegação no dashboard
  - Visualização de dados
  - Logout
- **Estimativa**: 6h

---

## 🎯 Critérios de Aceitação

### ✅ Funcionalidades Obrigatórias
1. **Autenticação Dual Funcionando**
   - Funcionários podem fazer login no sistema principal
   - Tutores podem fazer login no portal
   - JWTs contêm informações corretas do tipo de usuário

2. **Portal Básico Operacional**
   - Tela de login específica para tutores
   - Dashboard com dados básicos do tutor
   - Visualização de pets e agendamentos
   - Logout funcionando

3. **Segurança Garantida**
   - Tutores só acessam seus próprios dados
   - Funcionários mantêm acesso completo ao sistema
   - Senhas hasheadas corretamente
   - Tokens com expiração adequada

### 🔒 Critérios de Segurança
- [ ] Todas as senhas hasheadas com bcrypt
- [ ] JWTs com expiração de 1 hora
- [ ] Refresh tokens com rotação
- [ ] Rate limiting em endpoints de login
- [ ] Logs de auditoria para acessos
- [ ] Validação de ownership em todas as APIs

### 📊 Métricas de Sucesso
- **Performance**: Login em < 2 segundos
- **Segurança**: 0 vulnerabilidades críticas
- **UX**: Interface responsiva e intuitiva
- **Cobertura**: > 80% de testes automatizados

---

## 🚀 Plano de Execução

### Semana 1: Backend e Arquitetura
- **Dias 1-2**: Migration do banco e AuthService
- **Dias 3-4**: APIs de autenticação e middleware
- **Dia 5**: APIs específicas do portal

### Semana 2: Frontend e Integração
- **Dias 1-2**: Estrutura base e tela de login
- **Dias 3-4**: Dashboard e componentes
- **Dia 5**: Integração e ajustes

### Semana 3: Testes e Refinamentos
- **Dias 1-2**: Testes automatizados
- **Dias 3-4**: Testes manuais e correções
- **Dia 5**: Deploy e validação final

---

## ⚠️ Riscos e Mitigações

### 🔴 Riscos Altos
1. **Perda de dados na migração**
   - **Mitigação**: Backup completo + ambiente de teste
   - **Plano B**: Script de rollback

2. **Quebra da autenticação existente**
   - **Mitigação**: Testes extensivos + deploy gradual
   - **Plano B**: Manter sistema antigo em paralelo

### 🟡 Riscos Médios
1. **Performance degradada**
   - **Mitigação**: Profiling + otimização de queries
   - **Monitoramento**: Métricas de response time

2. **UX confusa para tutores**
   - **Mitigação**: Testes de usabilidade + feedback
   - **Iteração**: Ajustes baseados no uso real

---

## 📋 Checklist de Entrega

### Backend
- [ ] Schema Prisma atualizado
- [ ] Migration executada com sucesso
- [ ] AuthService refatorado
- [ ] APIs do portal implementadas
- [ ] Middleware de segurança funcionando
- [ ] Testes de integração passando

### Frontend
- [ ] Estrutura do portal criada
- [ ] Tela de login implementada
- [ ] Dashboard básico funcionando
- [ ] Navegação e logout operacionais
- [ ] Responsividade garantida
- [ ] Testes E2E passando

### DevOps
- [ ] Ambiente de desenvolvimento configurado
- [ ] Scripts de deploy atualizados
- [ ] Monitoramento implementado
- [ ] Backup e recovery testados

---

## 🎉 Próximos Passos (Sprint 2)

Após a conclusão do Sprint 1, o Sprint 2 focará em:
1. **Agendamento Online**: Tutores podem agendar consultas
2. **Notificações**: Sistema de lembretes e confirmações
3. **Histórico Detalhado**: Prontuários e histórico médico
4. **Melhorias de UX**: Refinamentos baseados no feedback

---

**Status Atual**: 🔄 **EM PLANEJAMENTO**
**Próxima Ação**: Executar migration do banco de dados
**Responsável**: Equipe de Desenvolvimento
**Data de Início Prevista**: Após aprovação da veterinária